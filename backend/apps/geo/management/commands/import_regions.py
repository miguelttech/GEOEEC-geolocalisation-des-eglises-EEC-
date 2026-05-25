"""
=============================================================================
FICHIER N°2 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/geo/management/commands/import_regions.py
CRÉÉ     : Phase 2 — Import des données géographiques
DÉPEND DE: apps/geo/models.py (RegionSynodale doit exister)
           data/gis/Region_synodale_ok2.shp (fichier Shapefile)
DOIT ÊTRE EXÉCUTÉ AVANT: import_paroisses.py (les paroisses ont besoin des régions)
=============================================================================

OBJECTIF :
  Lire le fichier Shapefile des régions synodales EEC et créer les 22 régions
  dans la base de données PostgreSQL/PostGIS avec leurs géométries (polygones).

QU'EST-CE QU'UN SHAPEFILE (.shp) ?
  Un Shapefile est un format de fichier géographique standard.
  Il stocke des géométries (polygones, points, lignes) et leurs attributs.
  Le fichier Region_synodale_ok2.shp contient :
  - 22 polygones représentant les frontières des régions synodales EEC
  - Des attributs comme le nom de chaque région ("Region_syn")
  Un Shapefile vient toujours avec des fichiers compagnons :
  - .shp : les géométries (les polygones)
  - .dbf : les attributs (les noms, codes, etc.)
  - .shx : l'index spatial
  - .prj : le système de coordonnées (WGS84 dans notre cas)

QU'EST-CE QU'UN POLYGONE GÉOGRAPHIQUE ?
  Une région synodale est représentée par un polygone : une liste de points
  GPS qui forment une frontière fermée. Exemple simplifié :
  Adamaoua = [(lat1,lon1), (lat2,lon2), ..., (lat1,lon1)]
  Ce polygone peut ensuite être affiché sur une carte Leaflet.

POURQUOI MULTIPOLYGON ET PAS POLYGON ?
  Certaines régions EEC sont composées de plusieurs parties disjointes
  (comme des îles). Un MultiPolygon peut contenir plusieurs Polygons.
  Notre modèle utilise MultiPolygon pour gérer les deux cas.
  Quand le shapefile donne un Polygon simple → on le convertit en
  MultiPolygon automatiquement.

SRID 4326 — QU'EST-CE QUE C'EST ?
  SRID = Spatial Reference Identifier = identifiant du système de coordonnées.
  SRID 4326 = WGS84 = le système GPS standard (latitude/longitude en degrés).
  C'est le même système que Google Maps, OpenStreetMap, etc.
  PostGIS a besoin de ce code pour savoir comment interpréter les coordonnées.

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_regions

OPTION DRY-RUN :
  docker compose run --rm backend python manage.py import_regions --dry-run
  → Affiche ce qui SERAIT importé, sans rien écrire en base.
=============================================================================
"""

# BaseCommand : classe de base Django pour les commandes de gestion
# Donne accès à self.stdout (affichage normal) et self.stderr (erreurs)
from django.core.management.base import BaseCommand

# DataSource : classe GDAL de Django pour ouvrir les fichiers géographiques
# GDAL = Geospatial Data Abstraction Library (bibliothèque géospatiale)
# Elle permet de lire les Shapefiles, GeoJSON, KML, etc.
from django.contrib.gis.gdal import DataSource

# GEOSGeometry : convertit une représentation texte (WKT) en objet géométrique Django
# MultiPolygon  : géométrie composite contenant plusieurs polygones
# Polygon       : géométrie simple d'un seul polygone
# WKT = Well-Known Text = format texte standard pour décrire une géométrie
# Exemple WKT : "POLYGON ((lon1 lat1, lon2 lat2, ..., lon1 lat1))"
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon

# RegionSynodale : le modèle Django de la table des régions
from apps.geo.models import RegionSynodale


# =============================================================================
# TABLE DE CORRESPONDANCE DES NOMS DE RÉGIONS
#
# PROBLÈME :
#   5 régions synodales ont des noms légèrement différents selon leur source :
#   - Dans le Shapefile : "HAUT-NKAM" (avec tiret)
#   - Dans l'Excel : "HAUT NKAM" (sans tiret)
#   Ce dictionnaire normalise ces 5 noms pour qu'ils soient uniformes en base.
#
# POURQUOI GARDER LES NOMS DU SHAPEFILE ?
#   Le Shapefile est la référence géographique officielle. Les noms du Shapefile
#   seront utilisés pour lier les paroisses (import_paroisses.py) et les oeuvres
#   (import_oeuvres.py) à leur région. Il faut donc un nom unique et stable.
#
# COMMENT ÇA MARCHE :
#   dict.get(clé, valeur_par_défaut) : cherche la clé dans le dictionnaire.
#   Si trouvée → retourne la valeur correspondante.
#   Si non trouvée → retourne la valeur par défaut (le nom tel quel).
#   On l'utilise ainsi : NOMS_REGIONS.get(nom_brut, nom_brut)
#   = si le nom est dans le dict → retourne la version corrigée
#   = sinon → retourne le nom original (déjà correct)
# =============================================================================
NOMS_REGIONS = {
    # Clé = nom dans le Shapefile → Valeur = nom normalisé stocké en base
    # Ces 5 entrées correspondent aux régions dont le nom est ambigu
    "HAUT-NKAM":             "HAUT-NKAM",           # tiret (pas espace)
    "HAUTS-PLATEAUX":        "HAUTS-PLATEAUX",       # tiret (pas espace)
    "MOUNGO SUD ET MEME":    "MOUNGO SUD ET MEME",   # "ET" (pas "&")
    "NDE & MBAM ET INOUBOU": "NDE & MBAM ET INOUBOU",# "&" pour NDE (pas "ET")
    "NORD & EXTREME NORD":   "NORD & EXTREME NORD",  # "EXTREME" (pas "EXTRÊME")
}


# =============================================================================
# CLASSE PRINCIPALE : Command
#
# Django exige que chaque commande de gestion :
#   1. Hérite de BaseCommand
#   2. Définisse self.help (description affichée avec --help)
#   3. Implémente handle() (logique principale)
# =============================================================================
class Command(BaseCommand):
    """
    Commande Django : python manage.py import_regions
    Importe les 22 régions synodales depuis le Shapefile vers PostgreSQL.
    """

    # Message affiché quand on fait : python manage.py import_regions --help
    help = "Importe les 22 régions synodales EEC depuis le fichier Shapefile"

    # ─────────────────────────────────────────────────────────────────────────
    # MÉTHODE : add_arguments()
    # Déclare les options optionnelles de la commande.
    # Django appelle cette méthode automatiquement avant handle().
    # ─────────────────────────────────────────────────────────────────────────
    def add_arguments(self, parser):
        """
        Déclare les options de ligne de commande.
        'parser' est un objet argparse fourni automatiquement par Django.
        """

        # Option --dry-run : simuler sans écrire en base
        # action="store_true" : si --dry-run est présent → True, sinon → False
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule l'import sans écrire en base (test sans risque)",
        )

        # Option --data-dir : chemin vers le dossier contenant les données
        # default="/data" : valeur par défaut (le volume Docker monté)
        parser.add_argument(
            "--data-dir",
            default="/data",
            help="Chemin vers le dossier contenant les fichiers sources (défaut: /data)",
        )

    # ─────────────────────────────────────────────────────────────────────────
    # MÉTHODE : handle()
    # Contient toute la logique d'import. Django l'appelle automatiquement.
    # ─────────────────────────────────────────────────────────────────────────
    def handle(self, *args, **options):
        """
        Point d'entrée principal. Lit le Shapefile et crée les régions en base.
        *args     : arguments positionnels (non utilisés ici)
        **options : dictionnaire des options déclarées dans add_arguments()
        """

        # Récupérer les options de la ligne de commande
        dry_run  = options["dry_run"]   # True si --dry-run a été passé
        data_dir = options["data_dir"]  # chemin vers le dossier data

        # Construire le chemin complet vers le Shapefile
        # f"..." : f-string Python = chaîne avec variables interpolées
        # Résultat : "/data/gis/Region_synodale_ok2.shp"
        shapefile = f"{data_dir}/gis/Region_synodale_ok2.shp"

        # Informer l'utilisateur du mode choisi
        if dry_run:
            # self.style.WARNING() : colore le texte en JAUNE dans le terminal
            self.stdout.write(self.style.WARNING("MODE SIMULATION — rien ne sera écrit en base"))

        self.stdout.write(f"Ouverture du Shapefile : {shapefile}")

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 1 : Ouvrir le Shapefile avec GDAL
        # ═══════════════════════════════════════════════════════════════════
        # DataSource(chemin) : ouvre le fichier géographique
        # C'est comme open() pour les fichiers texte, mais pour les fichiers GIS.
        # try/except : gérer l'erreur si le fichier n'existe pas ou est corrompu
        try:
            ds = DataSource(shapefile)
        except Exception as e:
            # self.style.ERROR() : colore le texte en ROUGE dans le terminal
            self.stderr.write(self.style.ERROR(
                f"Impossible d'ouvrir le Shapefile : {e}\n"
                "Vérifiez que le volume Docker est bien monté et que le fichier existe."
            ))
            return  # Arrêter l'exécution immédiatement

        # ds[0] : accéder à la première couche du DataSource
        # Un Shapefile n'a qu'une seule couche (contrairement au GeoJSON qui peut en avoir plusieurs)
        layer = ds[0]

        # Afficher des informations sur le Shapefile (utile pour le débogage)
        # len(layer) : nombre de régions dans le fichier (doit être 22)
        self.stdout.write(f"Shapefile ouvert : {len(layer)} régions trouvées")
        # layer.fields : liste des noms des colonnes attributaires
        # Doit contenir "Region_syn" (le champ avec le nom de la région)
        self.stdout.write(f"Champs disponibles : {layer.fields}")
        self.stdout.write("")  # Ligne vide pour la lisibilité

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 2 : Compteurs pour le bilan final
        # ═══════════════════════════════════════════════════════════════════
        nb_crees        = 0  # Régions nouvellement créées
        nb_mises_a_jour = 0  # Régions déjà existantes, géométrie mise à jour
        nb_erreurs      = 0  # Régions ayant provoqué une erreur

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 3 : Boucler sur chacune des 22 régions du Shapefile
        # ═══════════════════════════════════════════════════════════════════
        # Chaque 'feature' est une ligne du Shapefile :
        # - feature["Region_syn"].value : le nom de la région (attribut)
        # - feature.geom : le polygone géographique (géométrie)
        for feature in layer:

            # ─── 3a. Lire le nom de la région ────────────────────────────────
            # feature["Region_syn"] : accéder au champ "Region_syn"
            # .value : extraire la valeur Python (sinon c'est un objet GDAL)
            # str(...) : convertir en chaîne (au cas où ce serait autre chose)
            # .strip() : supprimer les espaces avant/après
            # .upper() : mettre en majuscules pour normalisation
            nom_brut = str(feature["Region_syn"].value).strip().upper()

            # Chercher une correction éventuelle dans NOMS_REGIONS
            # Si le nom est dans le dictionnaire → utiliser la version corrigée
            # Sinon → garder le nom tel quel (la plupart des régions sont déjà corrects)
            nom_final = NOMS_REGIONS.get(nom_brut, nom_brut)

            # ─── 3b. Lire et convertir la géométrie ──────────────────────────
            try:
                # feature.geom.wkt : récupérer la géométrie en format WKT (texte)
                # WKT = Well-Known Text, exemple :
                # "POLYGON ((13.5 7.2, 13.6 7.3, 13.5 7.4, 13.5 7.2))"
                geom_wkt = feature.geom.wkt

                # GEOSGeometry(wkt, srid=4326) : convertir le texte WKT en objet
                # géométrique Django compatible avec PostGIS.
                # srid=4326 : dire que ces coordonnées sont en WGS84 (GPS standard)
                geometrie = GEOSGeometry(geom_wkt, srid=4326)

                # Notre modèle RegionSynodale utilise MultiPolygonField.
                # Le Shapefile peut fournir soit un Polygon, soit un MultiPolygon.
                # isinstance(geometrie, Polygon) : vérifier si c'est un Polygon simple
                # Si c'est le cas → le convertir en MultiPolygon pour correspondre au modèle.
                # MultiPolygon(geometrie, srid=4326) : envelopper le Polygon dans un MultiPolygon
                if isinstance(geometrie, Polygon):
                    geometrie = MultiPolygon(geometrie, srid=4326)

            except Exception as e:
                # Si la géométrie est corrompue ou invalide → signaler et passer à la suivante
                self.stderr.write(self.style.ERROR(f"  Erreur géométrie pour {nom_brut} : {e}"))
                nb_erreurs += 1
                continue  # Passer à la région suivante sans l'importer

            # Afficher le nom en cours de traitement
            self.stdout.write(f"  Traitement : {nom_final} ...")

            # ─── 3c. Mode simulation ──────────────────────────────────────────
            # Si --dry-run est actif → afficher sans sauvegarder en base
            if dry_run:
                # self.style.WARNING() : texte jaune dans le terminal
                self.stdout.write(self.style.WARNING(
                    f"    [SIMULATION] Aurait créé/mis à jour : {nom_final}"
                ))
                continue  # Ne pas appeler update_or_create()

            # ─── 3d. Créer ou mettre à jour la région en base ────────────────
            try:
                # update_or_create() : méthode Django qui :
                #   - Cherche une RegionSynodale avec nom=nom_final
                #   - Si elle EXISTE → met à jour la géométrie
                #   - Si elle N'EXISTE PAS → crée une nouvelle entrée
                #
                # nom=nom_final         : critère de recherche (clé unique)
                # defaults={"geometrie"}: champs à créer ou mettre à jour
                #
                # Retourne (objet_region, a_ete_cree)
                # created = True si nouvelle entrée, False si mise à jour
                region, created = RegionSynodale.objects.update_or_create(
                    nom=nom_final,
                    defaults={
                        "geometrie": geometrie,  # stocker le polygone en PostGIS
                    }
                )

                if created:
                    nb_crees += 1
                    # self.style.SUCCESS() : texte VERT dans le terminal
                    self.stdout.write(self.style.SUCCESS(f"    CREEE : {nom_final}"))
                else:
                    nb_mises_a_jour += 1
                    self.stdout.write(f"    Mise a jour : {nom_final}")

            except Exception as e:
                # Erreur SQL ou autre → signaler et continuer
                self.stderr.write(self.style.ERROR(f"    Erreur pour {nom_final} : {e}"))
                nb_erreurs += 1

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 4 : Afficher le bilan final
        # ═══════════════════════════════════════════════════════════════════
        self.stdout.write("")  # Ligne vide
        self.stdout.write("=" * 50)  # Séparateur visuel

        if dry_run:
            # En mode simulation → message jaune indiquant qu'on n'a rien écrit
            self.stdout.write(self.style.WARNING("SIMULATION TERMINÉE — rien n'a été écrit"))
        else:
            # En mode normal → bilan vert avec le nombre de régions traitées
            # \n dans une f-string : retour à la ligne dans le message
            self.stdout.write(self.style.SUCCESS(
                f"IMPORT TERMINÉ\n"
                f"  Régions créées       : {nb_crees}\n"
                f"  Régions mises à jour : {nb_mises_a_jour}\n"
                f"  Erreurs              : {nb_erreurs}"
            ))
        self.stdout.write("=" * 50)
