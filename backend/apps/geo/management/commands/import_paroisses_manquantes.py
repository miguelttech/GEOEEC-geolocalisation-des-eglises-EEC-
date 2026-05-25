"""
=============================================================================
FICHIER N°5 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/geo/management/commands/import_paroisses_manquantes.py
CRÉÉ     : Phase 2 — Correction et complément de l'import des paroisses
DÉPEND DE: apps/geo/models.py (RegionSynodale, District, Paroisse)
DOIT ÊTRE EXÉCUTÉ APRÈS: import_paroisses.py
=============================================================================

OBJECTIF :
  Importer les 23 paroisses qui ont été ignorées lors du premier import
  (import_paroisses.py) parce que leur colonne "district" était vide
  dans le fichier Excel.

POURQUOI 23 PAROISSES N'ONT PAS ÉTÉ IMPORTÉES ?
  Dans la feuille Feuil2 du fichier Excel, 23 lignes n'ont pas de district.
  Sans district, on ne peut pas créer la relation Paroisse → District → Région.
  Le premier import les a donc ignorées plutôt que de créer des données erronées.

COMMENT ON RÈGLE CE PROBLÈME ?
  On a analysé manuellement chaque paroisse manquante et on a recherché
  son district probable en utilisant :
  1. Le nom de la paroisse lui-même (ex: "Bakap district de Bana" → district BANA)
  2. La paroisse précédente dans le fichier Excel (souvent dans le même district)
  3. La géographie camerounaise (localisation connue de la ville)

  Ces 23 corrections sont "codées en dur" dans le dictionnaire CORRECTIONS
  ci-dessous, avec un niveau de confiance pour chacune :
  ✅ CERTAINE  : district explicite dans le nom ou contexte direct
  ⚠️ ESTIMÉE   : déduction géographique raisonnable
  ❓ INCERTAINE : meilleure hypothèse, à vérifier par l'EEC

DEUX GROUPES DE PAROISSES :
  Groupe A (16 paroisses) : la région est connue, mais le district est absent.
  Ce sont des erreurs de saisie dans le fichier Excel (oubli de copier le nom
  du district dans les cellules fusionnées).

  Groupe B (7 paroisses) : ni la région ni le district ne sont renseignés.
  Ces paroisses se trouvent en fin de fichier, probablement ajoutées
  après coup sans compléter toutes les colonnes.

VÉRIFICATION ET CORRECTION POSSIBLES :
  Après l'import, l'administrateur EEC peut corriger les assignations
  incertaines directement dans l'interface Django Admin :
    http://localhost:8000/admin/geo/paroisse/

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_paroisses_manquantes

OPTIONS :
  --dry-run : simulation sans écriture en base
=============================================================================
"""

# BaseCommand : classe de base Django pour les commandes de gestion
from django.core.management.base import BaseCommand

# Les modèles géographiques nécessaires
from apps.geo.models import RegionSynodale, District, Paroisse


# =============================================================================
# TABLE DE CORRECTIONS
#
# Format de chaque entrée :
#   "Nom exact de la paroisse" : {
#       "region"    : nom de la région EN BASE (= nom issu du shapefile)
#       "district"  : nom du district (sera créé en base s'il n'existe pas encore)
#       "confiance" : "CERTAINE", "ESTIMÉE", ou "INCERTAINE"
#       "raison"    : explication de l'assignation pour la traçabilité
#   }
#
# IMPORTANT SUR LES NOMS DE RÉGIONS :
#   Les noms de régions ici doivent correspondre EXACTEMENT aux noms
#   stockés en base (issus du shapefile et importés par import_regions.py).
#   Ces noms sont en MAJUSCULES avec les bons tirets et caractères spéciaux.
# =============================================================================
CORRECTIONS = {

    # =========================================================================
    # GROUPE A — 16 paroisses avec région connue, district manquant dans l'Excel
    # =========================================================================

    # ✅ CERTAINE — Ngaoundal est une ville camerounaise distincte de Ngaoundéré.
    # La région ADAMAOUA a plusieurs districts ; Ngaoundal doit avoir le sien.
    # L'absence du district dans l'Excel est une erreur de saisie.
    "Ngaoundal": {
        "region":    "ADAMAOUA",
        "district":  "NGAOUNDAL",
        "confiance": "ESTIMEE",
        "raison":    "Ngaoundal est une ville distincte de Ngaounderé en Adamaoua. "
                     "Probablement un district a part entiere non saisi dans l'Excel.",
    },

    # ⚠️ ESTIMÉE — Bamemba est un village dans les Hauts Plateaux de l'Ouest camerounais.
    # Dans l'Excel, la paroisse précédente (Bambou'u) est dans le district BANGANG B.
    # On assigne BANGANG B par proximité géographique.
    "Bamemba": {
        "region":    "BAMBOUTOS ET NORD OUEST",
        "district":  "BANGANG B",
        "confiance": "ESTIMEE",
        "raison":    "La paroisse precedente dans le fichier (Bambou'u) est dans BANGANG B. "
                     "Bamemba est geographiquement proche de cette zone.",
    },

    # ⚠️ ESTIMÉE — Ngoulmekong existe en deux versions dans l'Excel.
    # Ngoulmekong II (autre ligne) est dans CENTRE 2.
    # Ngoulmekong I (=Ngoulmekong1) est probablement dans CENTRE 1 par symétrie.
    "Ngoulmekong1": {
        "region":    "CENTRE SUD 1",
        "district":  "CENTRE 1",
        "confiance": "ESTIMEE",
        "raison":    "Ngoulmekong II est dans le district CENTRE 2. "
                     "Par symetrie, Ngoulmekong I (Ngoulmekong1) est dans CENTRE 1.",
    },

    # ✅ CERTAINE — Le nom de cette paroisse contient lui-même son district !
    # "Bakap district de Bana" signifie : Paroisse Bakap, district de Bana.
    # Le district BANA est réel et se trouve dans la région Haut-Nkam.
    "Bakap district de Bana": {
        "region":    "HAUT-NKAM",
        "district":  "BANA",
        "confiance": "CERTAINE",
        "raison":    "Le nom de la paroisse dit explicitement 'district de Bana'. "
                     "BANA est un district reel du Haut-Nkam.",
    },

    # ⚠️ ESTIMÉE — BANDOUMKASSA est dans la zone de Bandja (Haut-Nkam).
    # Le préfixe "BANDOU-" est caractéristique du district de Bandja.
    # La paroisse précédente dans l'Excel (Bandja centre) est dans BANDJA.
    "BANDOUMKASSA": {
        "region":    "HAUT-NKAM",
        "district":  "BANDJA",
        "confiance": "ESTIMEE",
        "raison":    "Le prefixe BANDOU- est caracteristique du district de Bandja "
                     "dans le Haut-Nkam. La paroisse precedente est dans BANDJA.",
    },

    # ⚠️ ESTIMÉE — Banféko : le préfixe BAN- + la zone géographique suggère le district BANKA.
    "Banféko": {
        "region":    "HAUT-NKAM",
        "district":  "BANKA",
        "confiance": "ESTIMEE",
        "raison":    "Le prefixe BAN- et la terminaison -ko suggerent la zone de Banka "
                     "dans le Haut-Nkam.",
    },

    # ⚠️ ESTIMÉE — Basseu est géographiquement située dans la zone de Kekem (Haut-Nkam).
    "Basseu": {
        "region":    "HAUT-NKAM",
        "district":  "KEKEM",
        "confiance": "ESTIMEE",
        "raison":    "Basseu est geographiquement situee dans la zone de Kekem, "
                     "district du Haut-Nkam.",
    },

    # ⚠️ ESTIMÉE — Meji est dans la zone des Hauts Plateaux.
    # La paroisse précédente (Mboukue-Baham) est dans BAHAM NORD.
    "Meji": {
        "region":    "HAUTS-PLATEAUX",
        "district":  "BAHAM NORD",
        "confiance": "ESTIMEE",
        "raison":    "La paroisse precedente (Mboukue-Baham) est dans BAHAM NORD. "
                     "Meji est probablement dans la meme zone des Hauts Plateaux.",
    },

    # ✅ CERTAINE (par contexte) — Baneghang suit BAMENDOU-CHEFFERIE dans le fichier.
    # Les deux paroisses sont dans le même district BAMENDOU de la région MENOUA.
    "Baneghang": {
        "region":    "MENOUA",
        "district":  "BAMENDOU",
        "confiance": "CERTAINE",
        "raison":    "La paroisse immediatement precedente dans l'Excel (BAMENDOU-CHEFFERIE) "
                     "est dans le district BAMENDOU. Baneghang est dans la meme zone.",
    },

    # ✅ CERTAINE (par contexte) — Ndoungue A suit Ndombeng (NDOUNGUE NORD) dans le fichier.
    # Ndoungue A est une section de Ndoungué, dans le même district NORD.
    "Ndoungue A": {
        "region":    "MOUNGO CENTRE",
        "district":  "NDOUNGUE NORD",
        "confiance": "CERTAINE",
        "raison":    "La paroisse precedente (Ndombeng) est dans NDOUNGUE NORD. "
                     "Ndoungue A et Ndombeng sont toutes deux dans la zone de Ndoungue.",
    },

    # ❓ INCERTAINE — KASSANG est dans la Ndé-Mbam-et-Inoubou.
    # Sans information de contexte précise, on assigne TONGA (district principal de la région).
    "KASSANG": {
        "region":    "NDE & MBAM ET INOUBOU",
        "district":  "TONGA",
        "confiance": "INCERTAINE",
        "raison":    "Aucun indice de contexte disponible. TONGA est un district central "
                     "de la Nde-Mbam-et-Inoubou. A verifier aupres de l'EEC.",
    },

    # ✅ CERTAINE (par contexte) — Paroisse TIE2 suit Paroisse Mamevoue (TABE II) dans le fichier.
    "Paroisse TIE2": {
        "region":    "NOUN NORD",
        "district":  "TABE II",
        "confiance": "CERTAINE",
        "raison":    "La paroisse immediatement precedente (Paroisse Mamevoue) "
                     "est dans TABE II, NOUN NORD. Paroisse TIE2 est dans la meme zone.",
    },

    # ✅ CERTAINE (par contexte) — Company suit Baigom (FOUMBOT II) dans le fichier.
    "Company": {
        "region":    "NOUN SUD",
        "district":  "FOUMBOT II",
        "confiance": "CERTAINE",
        "raison":    "La paroisse precedente (Baigom) est dans FOUMBOT II, NOUN SUD. "
                     "Company est dans la meme zone geographique.",
    },

    # ✅ CERTAINE (par contexte) — Paroisse de MBANKOUOP suit Paroisse de Loumbouot (FOUMBOT II).
    "Paroisse de MBANKOUOP": {
        "region":    "NOUN SUD",
        "district":  "FOUMBOT II",
        "confiance": "CERTAINE",
        "raison":    "La paroisse precedente (Paroisse de Loumbouot) est dans FOUMBOT II, "
                     "NOUN SUD. MBANKOUOP est geographiquement dans la meme zone.",
    },

    # ⚠️ ESTIMÉE — NEW BELL TSF = une paroisse du quartier New Bell de Douala.
    # Dans l'EEC WOURI CENTRE, le district NJO-NJO couvre la zone New Bell.
    "NEW BELL TSF": {
        "region":    "WOURI CENTRE",
        "district":  "NJO-NJO",
        "confiance": "ESTIMEE",
        "raison":    "New Bell est un quartier de Douala. Dans l'EEC WOURI CENTRE, "
                     "le district NJO-NJO couvre la zone New Bell.",
    },

    # ⚠️ ESTIMÉE — YOUPWE est un quartier industrialo-portuaire de Douala.
    # Dans l'EEC WOURI CENTRE, BONAKOU est le district couvrant la zone portuaire.
    "YOUPWE": {
        "region":    "WOURI CENTRE",
        "district":  "BONAKOU",
        "confiance": "ESTIMEE",
        "raison":    "Youpwe est un quartier industrialo-portuaire de Douala. "
                     "Le district EEC BONAKOU couvre cette zone du Wouri Centre.",
    },

    # =========================================================================
    # GROUPE B — 7 paroisses sans région ni district (lignes 561-567 du fichier Excel)
    # Ces paroisses ont été ajoutées en fin de fichier sans renseigner la région
    # ni le district. Les assignations ci-dessous sont des estimations géographiques
    # à confirmer absolument par l'EEC via l'interface admin.
    # =========================================================================

    # ⚠️ ESTIMÉE — Manjouom suit Yassa Village (NEW-BELL D, WOURI SUD) dans le fichier.
    "Manjouom": {
        "region":    "WOURI SUD",
        "district":  "NEW-BELL D",
        "confiance": "ESTIMEE",
        "raison":    "Paroisse en fin de fichier sans region/district. "
                     "La paroisse precedente (Yassa Village) est dans NEW-BELL D, WOURI SUD.",
    },

    # ⚠️ ESTIMÉE — "Bahouoc" = Bahouan, village des Hauts Plateaux (zone Bamendjou).
    "Mfeutom  annexe de bahouoc": {
        "region":    "HAUTS-PLATEAUX",
        "district":  "BAHOUAN / BAMENDJOU",
        "confiance": "ESTIMEE",
        "raison":    "Le nom contient 'bahouoc' qui evoque Bahouan/Bamendjou "
                     "dans les Hauts Plateaux de l'Ouest.",
    },

    # ❓ INCERTAINE — Ngùendùem : nom de village de l'Ouest camerounais.
    # Sans information précise, on assigne BANGOU (Hauts Plateaux).
    "Ngùendùem": {
        "region":    "HAUTS-PLATEAUX",
        "district":  "BANGOU",
        "confiance": "INCERTAINE",
        "raison":    "Nom de village de l'Ouest camerounais. A verifier aupres de l'EEC.",
    },

    # ❓ INCERTAINE — Kaélé est une ville du Mayo-Kani (Extrême-Nord camerounais).
    "Paroisse de kaele": {
        "region":    "NORD & EXTREME NORD",
        "district":  "KAELE",
        "confiance": "INCERTAINE",
        "raison":    "Kaele est une ville de l'Extreme-Nord camerounais. "
                     "Le district KAELE sera cree si necessaire. A confirmer.",
    },

    # ❓ INCERTAINE — SOA est une commune de la Mefou-et-Afamba (banlieue de Yaoundé).
    "Paroisse de SOA": {
        "region":    "CENTRE SUD 1",
        "district":  "LEKIE' ET MBAM",
        "confiance": "INCERTAINE",
        "raison":    "SOA est une commune de la banlieue de Yaounde (Mefou-et-Afamba). "
                     "Probablement dans le district LEKIE' ET MBAM du CENTRE SUD 1.",
    },

    # ❓ INCERTAINE — Takasko : localité du Nord camerounais.
    "Paroisse de Takasko": {
        "region":    "NORD & EXTREME NORD",
        "district":  "KAELE",
        "confiance": "INCERTAINE",
        "raison":    "Takasko est une localite du Nord camerounais. "
                     "District a confirmer aupres de l'EEC.",
    },

    # ⚠️ ESTIMÉE — Paroisse de TIE2 (fin de fichier) = probablement la même zone
    # que Paroisse TIE2 (ligne 460, NOUN NORD, TABE II). Possible doublon.
    "Paroisse de TIE2": {
        "region":    "NOUN NORD",
        "district":  "TABE II",
        "confiance": "ESTIMEE",
        "raison":    "Probablement la meme zone que 'Paroisse TIE2' (ligne 460, TABE II). "
                     "Attention : possible doublon avec la paroisse deja importee.",
    },
}


# =============================================================================
# CLASSE PRINCIPALE : Command
# =============================================================================
class Command(BaseCommand):
    """
    Commande Django qui importe les 23 paroisses manquantes.
    Django l'exécute avec : python manage.py import_paroisses_manquantes
    """

    # Message affiché avec --help
    help = "Importe les 23 paroisses ignorees lors du premier import (district vide)"

    def add_arguments(self, parser):
        """Déclare les options de ligne de commande."""

        # --dry-run : simuler sans écrire en base
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule sans ecrire en base"
        )

    def handle(self, *args, **options):
        """Méthode principale appelée par Django."""

        # Récupérer l'option --dry-run
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("MODE SIMULATION — rien ne sera ecrit"))

        # Afficher le nombre de paroisses à importer
        # len(CORRECTIONS) : nombre d'entrées dans le dictionnaire (23)
        self.stdout.write(f"\n{len(CORRECTIONS)} paroisses a importer avec correction de district")
        self.stdout.write("=" * 65)

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 1 : Charger les caches des Régions et Districts en mémoire
        # ═══════════════════════════════════════════════════════════════════
        # Cache des régions : "NOM_REGION" → objet RegionSynodale
        # On utilise .upper() pour une comparaison insensible à la casse
        regions_en_base = {r.nom.upper(): r for r in RegionSynodale.objects.all()}

        # Cache des districts : ("NOM_REGION", "NOM_DISTRICT") → objet District
        # La clé est un tuple (region, district) car un même nom de district
        # peut exister dans plusieurs régions (ex: "CENTRE 1" dans plusieurs régions)
        # .select_related("region") : charge la région liée en un seul SQL JOIN
        districts_en_base = {
            (d.region.nom.upper(), d.nom.upper()): d
            for d in District.objects.select_related("region").all()
        }

        # Compteurs pour le bilan final
        nb_districts_crees = 0  # Nouveaux districts créés (non présents dans l'Excel principal)
        nb_paroisses_crees = 0  # Paroisses nouvellement créées
        nb_paroisses_maj   = 0  # Paroisses déjà existantes, mises à jour
        nb_erreurs         = 0  # Erreurs (région non trouvée, etc.)

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 2 : Traiter chaque paroisse de la table CORRECTIONS
        # ═══════════════════════════════════════════════════════════════════
        # .items() : itérer sur les paires (nom_paroisse, infos) du dictionnaire
        for nom_paroisse, infos in CORRECTIONS.items():

            # Extraire les informations de la correction
            nom_region   = infos["region"].upper()    # Nom de la région (en majuscules)
            nom_district = infos["district"].upper()  # Nom du district (en majuscules)
            confiance    = infos["confiance"]         # Niveau de certitude
            raison       = infos["raison"]            # Explication de l'assignation

            # ─── Retrouver la région en base ──────────────────────────────────
            region_obj = regions_en_base.get(nom_region)

            if not region_obj:
                # La région n'existe pas en base → erreur critique, on ne peut pas continuer
                # sans elle (la relation Paroisse → District → Région est obligatoire)
                self.stderr.write(self.style.ERROR(
                    f"  ERREUR : Region '{infos['region']}' introuvable en base "
                    f"pour '{nom_paroisse}'"
                ))
                nb_erreurs += 1
                continue  # Passer à la paroisse suivante

            # ─── Retrouver ou créer le District ──────────────────────────────
            # La clé dans le cache est (NOM_REGION, NOM_DISTRICT)
            cle_district = (nom_region, nom_district)
            district_obj = districts_en_base.get(cle_district)

            if not district_obj:
                # Le district n'existe pas encore en base → il faut le créer
                if dry_run:
                    # Mode simulation → afficher sans créer
                    self.stdout.write(self.style.WARNING(
                        f"  [SIM] Nouveau district : '{infos['district']}' "
                        f"dans '{infos['region']}'"
                    ))
                else:
                    # get_or_create() : chercher ou créer le district
                    # (différent de update_or_create car le district n'a rien à mettre à jour)
                    # Retourne (objet, True si créé / False si existait déjà)
                    district_obj, dist_created = District.objects.get_or_create(
                        nom=infos["district"],  # nom du district (ex: "BANA")
                        region=region_obj,       # la région parente
                    )

                    if dist_created:
                        nb_districts_crees += 1
                        self.stdout.write(
                            f"  + District cree : '{infos['district']}' ({infos['region']})"
                        )

                    # Mettre à jour le cache pour les prochaines itérations
                    # (au cas où deux paroisses auraient le même district nouveau)
                    districts_en_base[cle_district] = district_obj

            # ─── Afficher la correction avec son niveau de confiance ──────────
            # Choisir l'icône selon le niveau de confiance
            icone = {
                "CERTAINE":   "OK",   # ✅ CERTAINE
                "ESTIMEE":    "??",   # ⚠️ ESTIMÉE
                "INCERTAINE": "!",    # ❓ INCERTAINE
            }.get(confiance, "?")

            # Afficher sur plusieurs lignes pour la lisibilité
            self.stdout.write(
                f"\n  [{icone}] {confiance} | '{nom_paroisse}'"
                f"\n     → {infos['district']} ({infos['region']})"
                f"\n     Raison : {raison}"
            )

            # Si mode simulation → compter sans écrire
            if dry_run:
                nb_paroisses_crees += 1
                continue

            # ─── Créer ou mettre à jour la Paroisse ──────────────────────────
            try:
                # update_or_create() : créer ou mettre à jour la paroisse
                # Clé de recherche : (nom + district) — identifie une paroisse unique
                _, created = Paroisse.objects.update_or_create(
                    nom=nom_paroisse,      # nom exact de la paroisse (clé de recherche)
                    district=district_obj, # district assigné manuellement (clé de recherche)
                    defaults={
                        "adresse":  "",    # adresse vide (donnée non disponible pour ces paroisses)
                        "position": None,  # pas de GPS (données non disponibles non plus)
                    }
                )

                if created:
                    nb_paroisses_crees += 1
                    self.stdout.write(self.style.SUCCESS("     Paroisse CREEE"))
                else:
                    nb_paroisses_maj += 1
                    self.stdout.write("     Paroisse mise a jour")

            except Exception as e:
                # Erreur inattendue → afficher et continuer
                self.stderr.write(self.style.ERROR(f"     ERREUR : {e}"))
                nb_erreurs += 1

        # ═══════════════════════════════════════════════════════════════════
        # BILAN FINAL
        # ═══════════════════════════════════════════════════════════════════
        self.stdout.write("\n" + "=" * 65)
        self.stdout.write(self.style.SUCCESS(
            f"IMPORT PAROISSES MANQUANTES TERMINE\n"
            f"  Districts crees        : {nb_districts_crees}\n"
            f"  Paroisses creees       : {nb_paroisses_crees}\n"
            f"  Paroisses mises a jour : {nb_paroisses_maj}\n"
            f"  Erreurs                : {nb_erreurs}"
        ))
        self.stdout.write("")

        # Rappel important sur les corrections incertaines
        # Les assignations marquées ESTIMEE ou INCERTAINE doivent être vérifiées
        self.stdout.write(self.style.WARNING(
            "IMPORTANT : Les assignations ESTIMEE et INCERTAINE\n"
            "doivent etre verifiees et corrigees si necessaire via Django Admin :\n"
            "  http://localhost:8000/admin/geo/paroisse/"
        ))
        self.stdout.write("=" * 65)
