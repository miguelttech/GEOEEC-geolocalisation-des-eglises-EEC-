"""
=============================================================================
FICHIER : apps/geo/management/commands/import_gps_docx.py
RÔLE    : Importer les coordonnées GPS depuis le document Word de complétion

SOURCE
------
« paroisses_gps_completees_ok(2).docx » — tableau de 120 paroisses avec
latitude et longitude, produit hors plateforme. Le document indique lui-même
sa méthode : les coordonnées viennent d'une géolocalisation Google Places de
la LOCALITÉ (quartier, village) associée à chaque paroisse, et non d'un relevé
sur le lieu de culte.

CONSÉQUENCE À CONNAÎTRE
-----------------------
Les 120 lignes ne portent que 63 points distincts : plusieurs paroisses d'une
même localité reçoivent des coordonnées identiques — jusqu'à dix paroisses de
Bandjoun sur le centre-bourg. Ces positions situent donc la COMMUNE, pas
l'église. La décision de les importer telles quelles a été prise en connaissance
de ce fait ; l'affinage se fera plus tard.

Chaque écriture est consignée dans `HistoriquePosition`, ce qui rend l'import
auditable et permet de revenir en arrière paroisse par paroisse.

LECTURE DU .docx
----------------
Un .docx est une archive ZIP contenant du XML. On l'ouvre avec la
bibliothèque standard (zipfile + ElementTree) plutôt qu'avec python-docx :
aucune dépendance à installer, et le besoin se limite à lire un tableau.

CONVENTION DES COLONNES
-----------------------
Le document titre ses colonnes « Latitude (Y) » et « Longitude (X) », soit la
convention OGC. Attention : les fichiers Excel sources de l'EEC font l'inverse
(`Coord_x` y désigne la latitude). Ici on lit bien latitude puis longitude, et
on construit Point(longitude, latitude) comme l'exige GeoDjango.

USAGE
-----
    python manage.py import_gps_docx --dry-run
    python manage.py import_gps_docx --execute
    python manage.py import_gps_docx --execute --forcer   # ecrase un GPS existant
=============================================================================
"""

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.geo.docx import DocxIllisible, flottant, lignes_donnees, normaliser
from apps.geo.models import HistoriquePosition, Paroisse

# Chemin par défaut : le dossier data/ du dépôt est monté en lecture seule
# sur /data dans le conteneur backend (voir docker-compose.yml).
FICHIER_DEFAUT = "/data/paroisses_gps_completees_ok(2).docx"

# Emprise approximative du Cameroun, garde-fou contre une inversion de colonnes
# ou une coordonnée aberrante.
LON_MIN, LON_MAX = 8.4, 16.2
LAT_MIN, LAT_MAX = 1.6, 13.1

# Indices des colonnes dans le tableau du document.
COL_ID, COL_NOM, COL_LAT, COL_LON = 0, 3, 4, 5


class Command(BaseCommand):
    help = "Importe les coordonnees GPS des paroisses depuis le document Word."

    def add_arguments(self, parser):
        parser.add_argument("--fichier", default=FICHIER_DEFAUT,
                            help=f"Chemin du .docx (defaut : {FICHIER_DEFAUT}).")
        parser.add_argument("--execute", action="store_true",
                            help="Applique l'import. Sans ce drapeau, rien n'est ecrit.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation explicite (comportement par defaut).")
        parser.add_argument("--forcer", action="store_true",
                            help="Ecrase la position des paroisses qui en ont deja une.")

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]

        try:
            lignes = lignes_donnees(opts["fichier"], colonnes_min=6)
        except DocxIllisible as exc:
            raise CommandError(str(exc))
        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{'IMPORT REEL' if execute else 'SIMULATION (aucune ecriture)'} — "
            f"{len(lignes)} ligne(s) lues dans {opts['fichier']}"))

        ecrits, ignores, refuses, deja = 0, 0, [], 0
        points = {}

        with transaction.atomic():
            for cellules in lignes:
                l = {"id": int(cellules[COL_ID]), "nom": cellules[COL_NOM],
                     "lat": flottant(cellules[COL_LAT]), "lon": flottant(cellules[COL_LON])}
                paroisse = (Paroisse.objects
                            .select_related("district__region")
                            .filter(pk=l["id"]).first())

                if paroisse is None:
                    refuses.append(f"#{l['id']} \"{l['nom']}\" : aucune paroisse a cet identifiant")
                    continue

                # Le libellé doit concorder : un identifiant qui aurait glissé
                # placerait une paroisse aux coordonnées d'une autre.
                if normaliser(paroisse.nom) != normaliser(l["nom"]):
                    refuses.append(
                        f"#{l['id']} libelle divergent — document \"{l['nom']}\" "
                        f"vs base \"{paroisse.nom}\"")
                    continue

                if not (LAT_MIN <= l["lat"] <= LAT_MAX and LON_MIN <= l["lon"] <= LON_MAX):
                    refuses.append(
                        f"#{l['id']} \"{l['nom']}\" : {l['lat']}, {l['lon']} "
                        "hors de l'emprise du Cameroun")
                    continue

                if paroisse.position is not None and not opts["forcer"]:
                    deja += 1
                    continue

                ancienne = paroisse.position
                # GeoDjango attend Point(x, y) = Point(longitude, latitude).
                paroisse.position = Point(l["lon"], l["lat"], srid=4326)
                paroisse.save(update_fields=["position", "updated_at"])

                HistoriquePosition.objects.create(
                    type_objet="paroisse",
                    objet_id=paroisse.pk,
                    ancienne_position=ancienne,
                    nouvelle_position=paroisse.position,
                    raison_changement=(
                        "Import du document « paroisses_gps_completees_ok(2).docx ». "
                        "Coordonnees issues d'une geolocalisation Google Places de la "
                        "localite associee, non d'un releve sur le lieu de culte : "
                        "position indicative, a affiner."),
                )

                points.setdefault((l["lat"], l["lon"]), []).append(paroisse.nom)
                ecrits += 1

            if not execute:
                transaction.set_rollback(True)

        self._resumer(ecrits, deja, refuses, points, execute)

    def _resumer(self, ecrits, deja, refuses, points, execute):
        partages = {k: v for k, v in points.items() if len(v) > 1}
        n_partagees = sum(len(v) for v in partages.values())

        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  positions ecrites            : {ecrits}")
        self.stdout.write(f"  deja situees, laissees intactes : {deja}")
        self.stdout.write(f"  lignes refusees              : {len(refuses)}")
        for r in refuses:
            self.stdout.write(self.style.ERROR(f"      {r}"))

        self.stdout.write(f"\n  points distincts obtenus     : {len(points)}")
        self.stdout.write(self.style.WARNING(
            f"  paroisses partageant un point: {n_partagees} "
            f"(sur {len(partages)} points)"))
        if partages:
            pire = max(partages.items(), key=lambda kv: len(kv[1]))
            self.stdout.write(
                f"  plus gros amas               : {len(pire[1])} paroisses "
                f"sur {pire[0][0]:.5f}, {pire[0][1]:.5f}")
        self.stdout.write(
            "  Ces positions situent la localite, pas l'eglise : a affiner par releve.")

        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
