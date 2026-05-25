"""
=============================================================================
FICHIER N°8 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/accounts/management/commands/import_statistiques.py
CRÉÉ     : Phase 2 — Import des données statistiques
DÉPEND DE: apps/accounts/models.py (StatistiqueAnnuelle doit exister)
           apps/geo/models.py (Paroisse doit exister et être remplie)
DOIT ÊTRE EXÉCUTÉ APRÈS: import_paroisses.py, import_paroisses_manquantes.py
=============================================================================

OBJECTIF :
  Lire la feuille "Feuil2" du fichier Excel des paroisses et créer une
  statistique annuelle pour chaque paroisse : nombre de communiants et
  de non-communiants pour l'année 2025.

QU'EST-CE QU'UN COMMUNIANT DANS L'EEC ?
  L'EEC divise ses membres en deux catégories :
  - Communiants (ou "membres confirmés") : fidèles baptisés et confirmés
    qui peuvent participer à la Sainte-Cène (communion). Ils ont une
    certaine formation chrétienne et ont fait profession de foi.
  - Non-communiants : fidèles non encore confirmés (enfants, catéchumènes,
    personnes en cours de formation) et toute personne fréquentant la paroisse
    sans être membre officiel.
  Total fidèles = communiants + non-communiants.

POURQUOI FEUIL2 ET PAS FEUIL1 ?
  Le fichier Excel contient deux feuilles :
  - Feuil1 : les réponses brutes du formulaire Google (693 lignes)
    → Beaucoup de doublons (paroisses ayant soumis le formulaire plusieurs fois)
  - Feuil2 : version nettoyée par l'équipe EEC (543 paroisses uniques)
    → La source fiable pour les statistiques (une ligne = une paroisse)

CE QU'ON IMPORTE ET CE QU'ON N'IMPORTE PAS :
  Données disponibles dans l'Excel et importées :
  ✅ communiants     (colonne 6 de Feuil2)
  ✅ non_communiants (colonne 7 de Feuil2)

  Données NON disponibles dans l'Excel (restent à 0) :
  ❌ baptemes         (absents du formulaire 2025)
  ❌ confirmations    (absents du formulaire 2025)
  ❌ mariages         (absents du formulaire 2025)
  ❌ deces            (absents du formulaire 2025)
  ❌ offrandes        (absents du formulaire 2025)
  ❌ dimes            (absents du formulaire 2025)
  → Ces données peuvent être saisies manuellement via l'admin Django

GESTION DES DOUBLONS DANS FEUIL2 :
  Feuil2 peut encore avoir des doublons (même paroisse listée deux fois).
  On lit d'abord toutes les données dans un dictionnaire en mémoire.
  Pour chaque doublon, on garde la ligne avec la somme la plus grande
  (communiants + non_communiants), supposant que c'est la plus complète.

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_statistiques

OPTIONS :
  --dry-run  : simulation sans écriture en base
  --data-dir : chemin vers le dossier data (défaut : /data)
  --annee    : année de référence (défaut : 2025)
=============================================================================
"""

# os : module Python pour les opérations sur les fichiers et dossiers
import os

# openpyxl : bibliothèque Python pour lire les fichiers Excel
import openpyxl

# BaseCommand : classe de base pour les commandes Django
from django.core.management.base import BaseCommand

# Paroisse : modèle des paroisses (pour retrouver chaque paroisse par son nom)
from apps.geo.models import Paroisse

# StatistiqueAnnuelle : modèle qu'on va remplir avec les données de l'Excel
from apps.accounts.models import StatistiqueAnnuelle


# =============================================================================
# INDEX DES COLONNES DANS FEUIL2
#
# La feuille Feuil2 a cette structure (base 0) :
#   [0]  vide ou numéro
#   [1]  Niveau
#   [2]  Region_synodale
#   [3]  districts
#   [4]  Nom de la paroisse   ← UTILISÉ
#   [5]  Quartier
#   [6]  communiants          ← UTILISÉ
#   [7]  non-communiants      ← UTILISÉ
#   [8]  ouvriers (total)
#   [9]  Nom (dupliqué)
#  [10]  Quartier (dupliqué)
#  [11]  Coord_x (latitude)
#  [12]  Coord_y (longitude)
#  [13]  Altitude
# =============================================================================

# COL_DISTRICT : index 3 = la 4ème colonne = Nom du district
COL_DISTRICT      = 3

# COL_NOM_PAROISSE : index 4 = la 5ème colonne = Nom de la paroisse
COL_NOM_PAROISSE  = 4

# COL_COMMUNIANTS : index 6 = la 7ème colonne = Nombre de communiants
COL_COMMUNIANTS   = 6

# COL_NON_COMM : index 7 = la 8ème colonne = Nombre de non-communiants
COL_NON_COMM      = 7


# =============================================================================
# FONCTION UTILITAIRE : to_int()
#
# PROBLÈME :
#   Les cellules Excel contenant des chiffres ne sont pas toujours des entiers.
#   Elles peuvent être :
#   - None         : cellule vide
#   - ""           : texte vide
#   - "N/A"        : non applicable
#   - 100.0        : float Excel (les nombres dans Excel sont souvent des floats)
#   - "100"        : texte représentant un nombre
#   - "1 234"      : nombre avec espace comme séparateur des milliers
#   - "1,234"      : nombre avec virgule comme séparateur décimal (convention française)
#
# SOLUTION :
#   Nettoyer et convertir la valeur en entier. Retourner 0 si impossible.
#
# EXEMPLES :
#   to_int(None)    → 0
#   to_int("")      → 0
#   to_int("N/A")   → 0
#   to_int(100.0)   → 100
#   to_int("1 234") → 1234
#   to_int("1,5")   → 1 (int(float("1.5")) = 1)
# =============================================================================
def to_int(valeur):
    """Convertit une valeur Excel en entier. Retourne 0 si impossible."""

    # Cas 1 : valeur nulle → retourner 0 directement
    if valeur is None:
        return 0

    # Cas général : essayer la conversion
    try:
        # str(valeur) : convertir en texte (pour gérer les floats et autres types)
        # .strip()    : supprimer les espaces avant/après
        # .replace(" ", "") : supprimer les espaces dans les nombres ("1 234" → "1234")
        # .replace(",", ".") : remplacer la virgule décimale par un point ("1,5" → "1.5")
        # float(...)  : convertir en nombre décimal (gère "100.0", "1.5", etc.)
        # int(...)    : convertir en entier (arrondit vers le bas : 1.9 → 1)
        return int(float(str(valeur).strip().replace(" ", "").replace(",", ".")))
    except (ValueError, TypeError):
        # ValueError : si la chaîne n'est pas convertible ("N/A", "abc")
        # TypeError  : si le type Python n'est pas supporté
        # → Dans ces cas, retourner 0
        return 0


# =============================================================================
# CLASSE PRINCIPALE : Command
# =============================================================================
class Command(BaseCommand):
    """
    Commande Django qui importe les statistiques annuelles des paroisses.
    Django l'exécute avec : python manage.py import_statistiques
    """

    # Message d'aide affiché avec --help
    help = "Importe les statistiques annuelles 2025 depuis Feuil2 (communiants, non-communiants)"

    def add_arguments(self, parser):
        """Déclare les options de ligne de commande."""

        # Option --dry-run : simuler sans écrire en base
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule sans écrire en base"
        )

        # Option --data-dir : chemin vers le dossier data
        parser.add_argument(
            "--data-dir",
            default="/data",
            help="Chemin vers le dossier data (défaut: /data)"
        )

        # Option --annee : permettre d'importer des stats pour d'autres années
        # type=int : Django convertit automatiquement la valeur en entier
        # default=2025 : si on ne précise pas l'année → utiliser 2025
        parser.add_argument(
            "--annee",
            type=int,
            default=2025,
            help="Année de référence des statistiques (défaut: 2025)"
        )

    def handle(self, *args, **options):
        """Méthode principale appelée par Django."""

        # Récupérer les options fournies en ligne de commande
        dry_run  = options["dry_run"]   # True ou False
        data_dir = options["data_dir"]  # "/data" par défaut
        annee    = options["annee"]     # 2025 par défaut

        if dry_run:
            self.stdout.write(self.style.WARNING("MODE SIMULATION — rien ne sera ecrit en base"))

        # Afficher l'année qui sera utilisée
        self.stdout.write(f"Annee de reference : {annee}")

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 1 : Trouver le fichier Excel des paroisses
        # ═══════════════════════════════════════════════════════════════════
        # os.listdir() : liste tous les fichiers du dossier data
        fichiers = os.listdir(data_dir)

        # Chercher le fichier paroisses (son nom contient "paroisse" ou "geo")
        # next() : prendre le PREMIER fichier correspondant
        nom_fichier = next(
            (f for f in fichiers if "paroisse" in f.lower() or "geo" in f.lower()),
            None  # retourner None si aucun fichier ne correspond
        )

        if not nom_fichier:
            self.stderr.write(self.style.ERROR("Fichier paroisses introuvable dans " + data_dir))
            return  # Arrêter l'exécution

        # Construire le chemin complet vers le fichier
        chemin = os.path.join(data_dir, nom_fichier)
        self.stdout.write(f"Fichier : {nom_fichier}")

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 2 : Ouvrir le fichier Excel et lire Feuil2
        # ═══════════════════════════════════════════════════════════════════
        # read_only=True : ouverture en lecture seule (plus rapide)
        # data_only=True : récupérer les valeurs calculées, pas les formules
        wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)

        # Vérifier que Feuil2 existe dans le fichier
        if "Feuil2" not in wb.sheetnames:
            self.stderr.write(self.style.ERROR("Feuille 'Feuil2' introuvable dans le fichier Excel"))
            return

        # Accéder à la feuille Feuil2
        ws = wb["Feuil2"]

        # Lire toutes les lignes (values_only=True → tuples de valeurs Python)
        rows = list(ws.iter_rows(values_only=True))

        # Sauter la première ligne (en-têtes des colonnes)
        # rows[0] = ("", "Niveau", "Region_synodale", "districts", ...)
        # rows[1:] = toutes les lignes de données
        data = rows[1:]

        self.stdout.write(f"Feuil2 : {len(data)} lignes brutes")

        # Fermer le fichier Excel pour libérer la mémoire
        wb.close()

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 3 : Construire le cache des paroisses en mémoire
        # ═══════════════════════════════════════════════════════════════════
        # Ce dictionnaire permet de retrouver une paroisse par (district + nom)
        # sans faire une requête SQL pour chaque ligne Excel.
        #
        # Exemple de contenu :
        # {
        #   ("NGAOUNDERE", "BIKOP")    : <Paroisse id=42>,
        #   ("SUD", "NGOMEDZAP")       : <Paroisse id=7>,
        #   ...
        # }
        #
        # .select_related("district") : charge le district de chaque paroisse
        # en un seul JOIN SQL (évite 543 requêtes séparées)
        #
        # .upper() : mettre en majuscules pour une comparaison insensible à la casse
        paroisses_db = {
            (p.district.nom.upper(), p.nom.upper()): p
            for p in Paroisse.objects.select_related("district").all()
        }
        self.stdout.write(f"Paroisses en base : {len(paroisses_db)}")

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 4 : Lire toutes les lignes et dédupliquer en mémoire
        # ═══════════════════════════════════════════════════════════════════
        # On ne fait PAS encore d'écriture en base.
        # On lit d'abord tout dans un dictionnaire pour gérer les doublons.
        # deja_vues : { paroisse_id : (communiants, non_communiants) }
        deja_vues = {}

        # Compteurs pour le bilan
        nb_ignores      = 0  # Lignes vides ou sans nom de paroisse
        nb_introuvables = 0  # Paroisses absentes de la base de données

        for i, row in enumerate(data, start=2):
            # Lire le nom de la paroisse (colonne obligatoire)
            nom_par  = row[COL_NOM_PAROISSE] if len(row) > COL_NOM_PAROISSE else None
            district = row[COL_DISTRICT]     if len(row) > COL_DISTRICT     else None

            # Ignorer les lignes sans nom de paroisse (séparateurs, lignes vides)
            if not nom_par or str(nom_par).strip() == "":
                nb_ignores += 1
                continue  # Passer à la ligne suivante

            # Nettoyer et mettre en majuscules pour la recherche dans le cache
            nom_par_clean  = str(nom_par).strip().upper()
            nom_dist_clean = str(district).strip().upper() if district else ""

            # TENTATIVE 1 : chercher la paroisse par (district + nom)
            paroisse_obj = paroisses_db.get((nom_dist_clean, nom_par_clean))

            if not paroisse_obj:
                # TENTATIVE 2 : chercher uniquement par nom de paroisse
                # Utile si le district est mal orthographié dans l'Excel
                # On ne prend le résultat que si la paroisse est UNIQUE par ce nom
                matches = [p for (d, n), p in paroisses_db.items() if n == nom_par_clean]
                if len(matches) == 1:
                    paroisse_obj = matches[0]

            # Si toujours pas trouvée → signaler et ignorer cette ligne
            if not paroisse_obj:
                nb_introuvables += 1
                continue

            # Lire les valeurs statistiques de cette ligne
            # to_int() : convertit en entier, retourne 0 si vide ou invalide
            communiants     = to_int(row[COL_COMMUNIANTS] if len(row) > COL_COMMUNIANTS else None)
            non_communiants = to_int(row[COL_NON_COMM]    if len(row) > COL_NON_COMM    else None)

            # GESTION DES DOUBLONS :
            # Si cette paroisse a déjà été vue dans les lignes précédentes,
            # on compare les totaux pour garder la ligne la plus complète.
            pid = paroisse_obj.pk  # pk = primary key = identifiant unique de la paroisse

            if pid in deja_vues:
                # Récupérer les valeurs de la ligne précédente pour cette paroisse
                prev_c, prev_nc = deja_vues[pid]

                # Comparer les totaux : garder la ligne avec le total le plus grand
                # Si la ligne actuelle est inférieure ou égale → garder la précédente
                if communiants + non_communiants <= prev_c + prev_nc:
                    continue  # Ignorer cette ligne moins complète

            # Mémoriser les valeurs pour cette paroisse (en écrasant si meilleure)
            deja_vues[pid] = (communiants, non_communiants)

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 5 : Insérer en base (après déduplication complète)
        # ═══════════════════════════════════════════════════════════════════
        # Maintenant qu'on a les meilleures valeurs pour chaque paroisse,
        # on peut insérer en base sans risque de doublon ou de mauvaise valeur.
        self.stdout.write(f"\nParoisses a traiter (apres deduplication) : {len(deja_vues)}")
        self.stdout.write("=" * 55)

        nb_crees = 0  # Statistiques nouvellement créées
        nb_maj   = 0  # Statistiques déjà existantes, mises à jour

        # Itérer sur chaque paroisse et ses meilleures valeurs
        # .items() : retourne les paires (clé, valeur) du dictionnaire
        for paroisse_id, (communiants, non_communiants) in deja_vues.items():

            # Retrouver l'objet Paroisse depuis son identifiant (pk)
            # On ne peut pas stocker l'objet directement dans deja_vues car
            # les objets Django ne sont pas hashables comme clé de dictionnaire
            try:
                paroisse_obj = Paroisse.objects.get(pk=paroisse_id)
            except Paroisse.DoesNotExist:
                # Cas très rare : la paroisse a été supprimée entre les deux passes
                continue

            # Mode simulation → afficher sans écrire
            if dry_run:
                # :35s = aligner sur 35 caractères pour une lisibilité en colonnes
                # :4d  = aligner les nombres sur 4 chiffres
                self.stdout.write(
                    f"  [SIM] {paroisse_obj.nom[:35]:35s} | "
                    f"comm={communiants:4d} | non_comm={non_communiants:4d}"
                )
                nb_crees += 1
                continue

            # update_or_create() : créer ou mettre à jour la statistique
            # La clé unique est (paroisse, annee) — définie par unique_together dans le modèle
            # → Si une StatistiqueAnnuelle pour cette paroisse et cette année existe → MàJ
            # → Si elle n'existe pas → créer
            _, created = StatistiqueAnnuelle.objects.update_or_create(
                paroisse=paroisse_obj,  # FK vers la paroisse
                annee=annee,             # l'année (2025 par défaut)
                defaults={
                    "communiants":     communiants,      # membres confirmés
                    "non_communiants": non_communiants,  # membres non confirmés
                    # Les autres champs (baptemes, mariages, deces, offrandes, dimes)
                    # restent à leur valeur par défaut (0) car absents de l'Excel.
                    # Ils peuvent être saisis manuellement dans l'admin Django.
                }
            )

            if created:
                nb_crees += 1
            else:
                nb_maj += 1

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 6 : Afficher le bilan final
        # ═══════════════════════════════════════════════════════════════════
        self.stdout.write("")
        self.stdout.write("=" * 55)
        self.stdout.write(self.style.SUCCESS(
            f"IMPORT STATISTIQUES {annee} TERMINE\n"
            f"  Creees                : {nb_crees}\n"
            f"  Mises a jour          : {nb_maj}\n"
            f"  Lignes ignorees       : {nb_ignores} (vides/separateurs)\n"
            f"  Paroisses non trouvees: {nb_introuvables}"
        ))
        self.stdout.write("")

        # Rappel important sur les données manquantes
        # self.style.WARNING() : texte JAUNE dans le terminal
        self.stdout.write(self.style.WARNING(
            "RAPPEL : baptemes, confirmations, mariages, deces, offrandes, dimes\n"
            "restent a 0 — ces donnees ne sont pas dans l'Excel source.\n"
            "Elles peuvent etre saisies via : http://localhost:8000/admin/"
        ))
        self.stdout.write("=" * 55)
