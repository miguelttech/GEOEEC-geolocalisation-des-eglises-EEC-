"""
=============================================================================
FICHIER N°3 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/geo/management/commands/import_paroisses.py
CRÉÉ     : Phase 2 — Import des données géographiques
DÉPEND DE: apps/geo/models.py (RegionSynodale, District, Paroisse)
           apps/geo/management/commands/import_regions.py (les régions doivent exister)
           data/[fichier paroisses].xlsx (fichier Excel avec Feuil2)
DOIT ÊTRE EXÉCUTÉ APRÈS: import_regions.py
DOIT ÊTRE EXÉCUTÉ AVANT: import_paroisses_manquantes.py, import_statistiques.py,
                          import_oeuvres.py, import_ouvriers.py
=============================================================================

OBJECTIF :
  En deux passes sur la feuille "Feuil2" du fichier Excel des paroisses :
  1. Créer tous les Districts (rattachés à leurs Régions)
  2. Créer toutes les Paroisses (rattachées à leurs Districts, avec GPS)

POURQUOI DEUX PASSES ET PAS UNE SEULE ?
  Une Paroisse appartient à un District, et un District appartient à une Région.
  Si on traitait tout en une seule passe, on risquerait de chercher un District
  qui n'a pas encore été créé (car la création des Districts se ferait en même
  temps que les Paroisses, ligne par ligne).
  En faisant une PASSE 1 pour créer TOUS les Districts, puis une PASSE 2 pour
  créer toutes les Paroisses, on est sûr que tous les Districts existent déjà
  quand on crée les Paroisses.

STRUCTURE DE FEUIL2 (une ligne = une paroisse) :
  Index  Colonne         Exemple
  [2]    Region_synodale "ADAMAOUA"
  [3]    districts       "NGAOUNDERE"
  [4]    Nom de la paroisse "Jourdain de beka hossere"
  [5]    Quartier/adresse  "Hosséré"
  [11]   Coord_x         "7.332"   ← c'est la LATITUDE (inversé !)
  [12]   Coord_y         "13.582"  ← c'est la LONGITUDE (inversé !)

PIÈGE : L'INVERSION COORD_X / COORD_Y
  Dans ce fichier Excel, les agents de saisie ont INVERSÉ les colonnes :
  - Coord_x devrait être la longitude → mais c'est la LATITUDE
  - Coord_y devrait être la longitude → mais c'est la LONGITUDE
  On doit donc lire Coord_x comme latitude et Coord_y comme longitude.
  Correction : lat = float(Coord_x), lon = float(Coord_y)
  Puis construire : Point(lon, lat) (ordre standard GIS : longitude d'abord)

FILTRAGE DES COORDONNÉES HORS CAMEROUN :
  Certaines coordonnées sont clairement erronées (ex: lat=0, lon=0 = "Null Island"
  dans l'Atlantique). On filtre en vérifiant que les coordonnées sont dans la
  bounding box du Cameroun : latitude [1.7, 13.1] et longitude [8.5, 16.2].
  Les paroisses hors bounding box sont importées sans position (position=None).

CORRECTIONS DES NOMS DE RÉGIONS :
  5 régions ont des noms différents entre l'Excel et la base (shapefile).
  Exemple : "HAUT NKAM" dans Excel → "HAUT-NKAM" en base.
  CORRECTIONS_REGIONS gère ces 5 cas.

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_paroisses

OPTIONS :
  --dry-run   : simulation sans écriture en base
  --data-dir  : chemin vers le dossier data (défaut : /data)
=============================================================================
"""

# os : module Python pour les opérations sur les fichiers et dossiers
import os

# openpyxl : bibliothèque Python pour lire les fichiers Excel (.xlsx)
import openpyxl

# BaseCommand : classe de base Django pour les commandes de gestion
from django.core.management.base import BaseCommand

# Point : classe Django GIS pour créer un point géographique (latitude, longitude)
# Un Point correspond à une localisation précise sur la carte (marqueur)
from django.contrib.gis.geos import Point

# Les trois modèles géographiques qu'on va remplir
from apps.geo.models import RegionSynodale, District, Paroisse


# =============================================================================
# CONSTANTES DE VALIDATION GÉOGRAPHIQUE
#
# La "bounding box" (boîte englobante) du Cameroun en coordonnées WGS84 (GPS).
# Toute coordonnée en dehors de ces limites est considérée comme une erreur de saisie.
# Ces valeurs correspondent aux frontières réelles du Cameroun :
#   - Latitude  : de 1.7° (au Sud, frontière Congo/Gabon) à 13.1° (au Nord, lac Tchad)
#   - Longitude : de 8.5° (à l'Ouest, frontière Nigeria) à 16.2° (à l'Est, RCA/Tchad)
# =============================================================================
CAM_LAT_MIN, CAM_LAT_MAX = 1.7, 13.1   # Limites nord/sud du Cameroun
CAM_LON_MIN, CAM_LON_MAX = 8.5, 16.2   # Limites est/ouest du Cameroun


# =============================================================================
# TABLE DE CORRECTIONS DES NOMS DE RÉGIONS
#
# PROBLÈME :
#   Dans l'Excel, 5 régions ont un nom légèrement différent de celui
#   qui a été importé depuis le Shapefile (import_regions.py).
#   En base → "HAUT-NKAM" (avec tiret, depuis le shapefile)
#   Dans Excel → "HAUT NKAM" (sans tiret, erreur de saisie)
#
# SOLUTION :
#   Un dictionnaire qui corrige ces noms avant de chercher en base.
#   Clé = nom DANS L'EXCEL → Valeur = nom EN BASE
#
# UTILISATION :
#   nom_region_base = CORRECTIONS_REGIONS.get(nom_region_excel, nom_region_excel)
#   = si le nom est dans le dict → utiliser la version corrigée
#   = sinon → garder le nom tel quel (les 17 autres régions sont déjà corrects)
# =============================================================================
CORRECTIONS_REGIONS = {
    "HAUT NKAM":           "HAUT-NKAM",           # tiret manquant dans l'Excel
    "HAUTS PLATEAUX":      "HAUTS-PLATEAUX",       # tiret manquant dans l'Excel
    "MOUNGO SUD & MEME":   "MOUNGO SUD ET MEME",  # "&" vs "ET" dans l'Excel
    "NDE MBAM ET INOUBOU": "NDE & MBAM ET INOUBOU",# "&" manquant avant MBAM
    "NORD & EXTREME-NORD": "NORD & EXTREME NORD",  # tiret vs espace dans EXTREME-NORD
}


# =============================================================================
# INDEX DES COLONNES DANS FEUIL2 (base 0)
#
# Feuil2 a cette structure :
#   [0]  vide
#   [1]  Niveau
#   [2]  Region_synodale  ← UTILISÉ
#   [3]  districts         ← UTILISÉ
#   [4]  Nom de la paroisse ← UTILISÉ
#   [5]  Quartier           ← UTILISÉ
#   [6]  Effectif communiants (traité par import_statistiques.py)
#   [7]  Effectif non-communiants
#   [8]  Effectif ouvriers
#   [9]  Nom (dupliqué)
#  [10]  Quartier (dupliqué)
#  [11]  Coord_x = LATITUDE  ← UTILISÉ (attention à l'inversion !)
#  [12]  Coord_y = LONGITUDE ← UTILISÉ (attention à l'inversion !)
#  [13]  Altitude
# =============================================================================
COL_REGION   = 2   # Region_synodale
COL_DISTRICT = 3   # Nom du district
COL_NOM      = 4   # Nom de la paroisse
COL_QUARTIER = 5   # Quartier / adresse
COL_COORD_X  = 11  # Coord_x = LATITUDE (colonne mal nommée dans l'Excel !)
COL_COORD_Y  = 12  # Coord_y = LONGITUDE (colonne mal nommée dans l'Excel !)


# =============================================================================
# CLASSE PRINCIPALE : Command
# =============================================================================
class Command(BaseCommand):
    """
    Commande Django : python manage.py import_paroisses
    Crée Districts puis Paroisses depuis la feuille Feuil2 du fichier Excel.
    """

    # Message affiché avec --help
    help = "Importe Districts et Paroisses depuis le fichier Excel (Feuil2)"

    def add_arguments(self, parser):
        """Déclare les options de ligne de commande."""

        # --dry-run : simuler sans écrire en base
        parser.add_argument("--dry-run", action="store_true",
                            help="Simule sans écrire en base")

        # --data-dir : chemin vers le dossier data (volume Docker)
        parser.add_argument("--data-dir", default="/data",
                            help="Chemin vers le dossier data (défaut: /data)")

    def handle(self, *args, **options):
        """Méthode principale : deux passes successives sur Feuil2."""

        # Récupérer les options
        dry_run  = options["dry_run"]   # True ou False
        data_dir = options["data_dir"]  # "/data" par défaut

        if dry_run:
            self.stdout.write(self.style.WARNING("MODE SIMULATION — rien ne sera ecrit"))

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 1 : Trouver et ouvrir le fichier Excel
        # ═══════════════════════════════════════════════════════════════════
        # Lister tous les fichiers dans le dossier data
        fichiers = os.listdir(data_dir)

        # Chercher le fichier dont le nom contient "paroisse" ou "geo"
        # (son nom peut varier selon la date de création du fichier).
        # L'extension Excel est OBLIGATOIRE dans le filtre : le dossier data
        # contient aussi des .docx dont le nom parle de paroisses (documents
        # de catégorisation), et openpyxl échoue dessus avec une erreur peu
        # lisible. sorted() rend le choix déterministe quand plusieurs
        # fichiers correspondent (ex. une copie « (1) » téléchargée deux fois).
        nom_fichier = next(
            (f for f in sorted(fichiers)
             if ("paroisse" in f.lower() or "geo" in f.lower())
             and f.lower().endswith((".xlsx", ".xlsm", ".xls"))),
            None
        )

        if not nom_fichier:
            self.stderr.write(self.style.ERROR("Fichier paroisses introuvable dans " + data_dir))
            return

        # Construire le chemin complet (ex: "/data/Recap_paroisses_26mai.xlsx")
        chemin = os.path.join(data_dir, nom_fichier)
        self.stdout.write(f"Fichier : {nom_fichier}")

        # Ouvrir le fichier Excel en lecture seule
        wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)

        # Vérifier que la feuille "Feuil2" existe dans le classeur
        # wb.sheetnames : liste des noms de feuilles du fichier Excel
        if "Feuil2" not in wb.sheetnames:
            self.stderr.write(self.style.ERROR("Feuille 'Feuil2' introuvable dans le fichier"))
            return

        # Ouvrir la feuille Feuil2
        ws = wb["Feuil2"]

        # Lire toutes les lignes en une fois (values_only=True = tuples de valeurs)
        rows = list(ws.iter_rows(values_only=True))

        # Sauter la ligne d'en-têtes (ligne 1 = noms de colonnes)
        data = rows[1:]

        self.stdout.write(f"Feuille Feuil2 : {len(data)} lignes brutes")

        # Fermer le fichier Excel pour libérer la mémoire
        wb.close()

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 2 : Charger le cache des Régions depuis la base de données
        # ═══════════════════════════════════════════════════════════════════
        # On crée un dictionnaire rapide : "NOM_REGION" → objet RegionSynodale
        # Ainsi on n'a pas besoin de faire une requête SQL pour chaque paroisse.
        # .upper() : mettre en majuscules pour comparer sans tenir compte de la casse
        regions_en_base = {r.nom.upper(): r for r in RegionSynodale.objects.all()}
        self.stdout.write(f"Regions en base : {len(regions_en_base)}")

        # Vérifier que des régions existent bien en base
        # Si 0 régions → il faut d'abord lancer import_regions.py
        if len(regions_en_base) == 0:
            self.stderr.write(self.style.ERROR(
                "Aucune region en base ! Lance d'abord : python manage.py import_regions"
            ))
            return

        # ═══════════════════════════════════════════════════════════════════
        # PASSE 1 : Créer tous les Districts
        # ═══════════════════════════════════════════════════════════════════
        # On fait D'ABORD cette passe pour que les Districts existent
        # quand on créera les Paroisses en passe 2.
        self.stdout.write("")
        self.stdout.write("--- PASSE 1 : Districts ---")

        # Collecter les combinaisons (region, district) uniques de toutes les lignes
        # On utilise un "set" (ensemble Python) qui ne garde automatiquement que les valeurs uniques
        # Exemple : si "NGAOUNDERE" apparaît 80 fois (80 paroisses), il ne sera ajouté qu'une fois
        paires_district = set()

        for row in data:
            # Lire le nom de la paroisse (pour ignorer les lignes vides)
            nom_par  = row[COL_NOM]      if len(row) > COL_NOM      else None
            region   = row[COL_REGION]   if len(row) > COL_REGION   else None
            district = row[COL_DISTRICT] if len(row) > COL_DISTRICT else None

            # Ignorer les lignes vides ou sans nom de paroisse (séparateurs visuels dans Excel)
            if not nom_par or str(nom_par).strip() == "":
                continue
            if not region or not district:
                continue  # Ignorer si région ou district manquant

            # Normaliser en majuscules et ajouter au set
            region_clean   = str(region).strip().upper()
            district_clean = str(district).strip().upper()
            paires_district.add((region_clean, district_clean))

        self.stdout.write(f"Combinaisons (region, district) uniques : {len(paires_district)}")

        # Compteurs pour le bilan de la passe 1
        nb_dist_crees = 0   # Districts nouvellement créés
        nb_dist_maj   = 0   # Districts déjà existants (mis à jour)
        nb_dist_err   = 0   # Districts avec région inconnue

        # Cache des districts créés : "NOM_DISTRICT" → objet District
        # Sera utilisé dans la passe 2 pour retrouver chaque district rapidement
        districts_en_base = {}

        # Parcourir les paires (region, district) dans l'ordre alphabétique
        # sorted() : trier pour un affichage ordonné dans le terminal
        for nom_region_excel, nom_district in sorted(paires_district):

            # Appliquer la correction du nom de région si nécessaire
            # Exemple : "HAUT NKAM" → "HAUT-NKAM"
            nom_region_base = CORRECTIONS_REGIONS.get(nom_region_excel, nom_region_excel)

            # Chercher la région dans le cache des régions
            region_obj = regions_en_base.get(nom_region_base)

            if not region_obj:
                # La région n'existe pas en base → erreur (ne devrait pas arriver)
                self.stderr.write(self.style.WARNING(
                    f"  Region inconnue : '{nom_region_excel}' → '{nom_region_base}' (ignoree)"
                ))
                nb_dist_err += 1
                continue  # Passer à la paire suivante

            if not dry_run:
                # update_or_create() : créer le district s'il n'existe pas, sinon le retrouver
                # La clé de recherche est (nom + region) car un même nom peut exister dans plusieurs régions
                # defaults={} : pas de champs à mettre à jour (le district n'a que nom + region)
                district_obj, created = District.objects.update_or_create(
                    nom=nom_district,
                    region=region_obj,
                    defaults={}  # Aucun champ supplémentaire à mettre à jour
                )

                # Ajouter au cache pour la passe 2
                districts_en_base[nom_district] = district_obj

                if created:
                    nb_dist_crees += 1
                else:
                    nb_dist_maj += 1

        # Afficher le bilan de la passe 1
        self.stdout.write(self.style.SUCCESS(
            f"Districts crees : {nb_dist_crees} | Mis a jour : {nb_dist_maj} | Erreurs : {nb_dist_err}"
        ))

        # Après la création, recharger le cache depuis la base pour avoir TOUS les districts
        # (y compris ceux qui existaient déjà avant cet import)
        if not dry_run:
            districts_en_base = {d.nom.upper(): d for d in District.objects.all()}

        # ═══════════════════════════════════════════════════════════════════
        # PASSE 2 : Créer toutes les Paroisses
        # ═══════════════════════════════════════════════════════════════════
        self.stdout.write("")
        self.stdout.write("--- PASSE 2 : Paroisses ---")

        # Compteurs pour le bilan de la passe 2
        nb_crees    = 0   # Paroisses nouvellement créées
        nb_maj      = 0   # Paroisses déjà existantes, mises à jour
        nb_ignores  = 0   # Lignes vides ou séparateurs
        nb_sans_gps = 0   # Paroisses sans coordonnées GPS du tout
        nb_gps_err  = 0   # Paroisses avec GPS hors Cameroun

        # Liste des paroisses avec GPS erroné (pour les afficher à la fin)
        # Ce sont des paroisses à corriger manuellement via l'admin Django
        gps_errones = []

        # Parcourir toutes les lignes de Feuil2 avec un compteur
        # enumerate(..., start=2) : le compteur i commence à 2 (la ligne 1 = en-têtes)
        for i, row in enumerate(data, start=2):

            # ─── Lire toutes les valeurs de la ligne ─────────────────────────
            nom_par  = row[COL_NOM]      if len(row) > COL_NOM      else None
            region   = row[COL_REGION]   if len(row) > COL_REGION   else None
            district = row[COL_DISTRICT] if len(row) > COL_DISTRICT else None
            quartier = row[COL_QUARTIER] if len(row) > COL_QUARTIER else None
            # Coord_x = LATITUDE (attention à l'inversion dans l'Excel !)
            coord_x  = row[COL_COORD_X]  if len(row) > COL_COORD_X  else None
            # Coord_y = LONGITUDE (attention à l'inversion dans l'Excel !)
            coord_y  = row[COL_COORD_Y]  if len(row) > COL_COORD_Y  else None

            # ─── Ignorer les lignes vides ou séparateurs ──────────────────────
            # Dans Excel, certaines lignes sont vides ou servent de séparateur visuel
            if not nom_par or str(nom_par).strip() == "":
                nb_ignores += 1
                continue  # Passer à la ligne suivante

            # Nettoyer le nom de la paroisse (supprimer les espaces superflus)
            nom_par_clean = str(nom_par).strip()

            # ─── Retrouver le District de la paroisse ────────────────────────
            # Normaliser le nom du district en majuscules pour la recherche dans le cache
            nom_district_clean = str(district).strip().upper() if district else ""

            # Chercher dans le cache des districts (dictionnaire déjà chargé)
            district_obj = districts_en_base.get(nom_district_clean)

            # Si le district n'est pas trouvé en base → signaler et ignorer
            # (ne devrait pas arriver si la passe 1 s'est bien passée)
            if not district_obj and not dry_run:
                self.stderr.write(self.style.WARNING(
                    f"  Ligne {i} — District inconnu : '{nom_district_clean}' pour '{nom_par_clean}'"
                ))
                nb_ignores += 1
                continue

            # ─── Gérer les coordonnées GPS ────────────────────────────────────
            position = None  # Par défaut, pas de position (position=null en base)

            if coord_x is not None and coord_y is not None:
                try:
                    # RAPPEL INVERSION : dans l'Excel, Coord_x = latitude, Coord_y = longitude
                    lat = float(coord_x)  # Coord_x est la LATITUDE
                    lon = float(coord_y)  # Coord_y est la LONGITUDE

                    # Vérifier que les coordonnées sont dans la bounding box du Cameroun
                    # Si une des conditions est fausse → coordonnées hors Cameroun
                    if (CAM_LAT_MIN <= lat <= CAM_LAT_MAX and
                            CAM_LON_MIN <= lon <= CAM_LON_MAX):
                        # Point(longitude, latitude) : ordre standard GIS (lon d'abord !)
                        # srid=4326 : système WGS84 (GPS standard)
                        position = Point(lon, lat, srid=4326)
                    else:
                        # GPS hors Cameroun → noter pour le rapport final
                        gps_errones.append({
                            "ligne": i,
                            "nom":   nom_par_clean,
                            "lat":   lat,
                            "lon":   lon,
                        })
                        nb_gps_err += 1
                        # position reste None → paroisse importée sans coordonnées

                except (ValueError, TypeError):
                    # La valeur n'est pas un nombre → ignorer (position reste None)
                    pass
            else:
                # Pas de coordonnées du tout dans l'Excel
                nb_sans_gps += 1
                # position reste None

            # ─── Mode simulation ──────────────────────────────────────────────
            if dry_run:
                self.stdout.write(
                    f"  [SIM] Ligne {i} : '{nom_par_clean}' | GPS={'oui' if position else 'non'}"
                )
                nb_crees += 1
                continue  # Ne pas écrire en base

            # ─── Créer ou mettre à jour la Paroisse en base ──────────────────
            try:
                # update_or_create() : créer la paroisse ou la mettre à jour
                # Clé de recherche : (nom + district) → identifie une paroisse unique
                # Il peut exister des paroisses avec le même nom dans des districts différents
                # (ex: "Bikop" peut exister dans plusieurs districts → la clé (district, nom) est unique)
                _, created = Paroisse.objects.update_or_create(
                    nom=nom_par_clean,      # nom de la paroisse (clé de recherche)
                    district=district_obj,  # son district (clé de recherche)
                    defaults={
                        # adresse : le quartier ou la localisation dans la ville
                        # str(...).strip() : convertir et nettoyer
                        # "if quartier else """ : si quartier est None → chaîne vide
                        "adresse":  str(quartier).strip() if quartier else "",
                        # position : l'objet Point GIS (ou None si pas de GPS valide)
                        "position": position,
                    }
                )

                if created:
                    nb_crees += 1
                else:
                    nb_maj += 1

            except Exception as e:
                # En cas d'erreur SQL ou autre → signaler sans arrêter l'import
                self.stderr.write(self.style.ERROR(
                    f"  Ligne {i} — Erreur pour '{nom_par_clean}' : {e}"
                ))

        # ═══════════════════════════════════════════════════════════════════
        # BILAN FINAL
        # ═══════════════════════════════════════════════════════════════════
        self.stdout.write("")
        self.stdout.write("=" * 55)
        self.stdout.write(self.style.SUCCESS(
            f"IMPORT PAROISSES TERMINE\n"
            f"  Creees              : {nb_crees}\n"
            f"  Mises a jour        : {nb_maj}\n"
            f"  Ignorees            : {nb_ignores} (vides/separateurs)\n"
            f"  Sans GPS            : {nb_sans_gps} (position=null)\n"
            f"  GPS hors Cameroun   : {nb_gps_err} (position=null)"
        ))

        # Si des paroisses ont des GPS erronés → les afficher pour correction manuelle
        if gps_errones:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(
                "Paroisses avec GPS errone (a corriger manuellement) :"
            ))
            for p in gps_errones:
                # Afficher le numéro de ligne Excel, le nom, et les coordonnées erronées
                self.stdout.write(
                    f"  Ligne {p['ligne']} | {p['nom']} | lat={p['lat']} lon={p['lon']}"
                )
            self.stdout.write(self.style.WARNING(
                "Pour corriger : http://localhost:8000/admin/geo/paroisse/"
            ))

        self.stdout.write("=" * 55)
