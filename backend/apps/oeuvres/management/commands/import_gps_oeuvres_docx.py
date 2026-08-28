"""
=============================================================================
FICHIER : apps/oeuvres/management/commands/import_gps_oeuvres_docx.py
RÔLE    : Importer les coordonnées GPS des œuvres depuis le document Word

SOURCE
------
« oeuvres_sans_gps_ok.docx » — 138 œuvres avec latitude, longitude, et une
colonne « Précision / Source » que le document renseigne lui-même :

    localite  (75)  le point est celui du village ou du quartier
    approx    (61)  approximation autour d'un repère voisin
    district  (2)   seul l'échelon district était connu

Aucune de ces valeurs n'est un relevé sur le bâtiment. Les 138 lignes ne
portent que 61 points distincts : là où plusieurs œuvres partagent une
localité, elles reçoivent le même point — jusqu'à quinze sur un seul.

La précision déclarée est reportée dans `HistoriquePosition.raison_changement`,
afin qu'on sache plus tard, œuvre par œuvre, d'où venait la coordonnée et
laquelle mérite un relevé.

USAGE
-----
    python manage.py import_gps_oeuvres_docx --dry-run
    python manage.py import_gps_oeuvres_docx --execute
=============================================================================
"""

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.geo.docx import DocxIllisible, flottant, lignes_donnees, normaliser
from apps.geo.models import HistoriquePosition
from apps.oeuvres.models import Oeuvre

FICHIER_DEFAUT = "/data/oeuvres_sans_gps_ok.docx"

# Emprise approximative du Cameroun : garde-fou contre une inversion de
# colonnes ou une coordonnée aberrante.
LON_MIN, LON_MAX = 8.4, 16.2
LAT_MIN, LAT_MAX = 1.6, 13.1

# Indices des colonnes dans le tableau du document.
COL_ID, COL_NOM, COL_LAT, COL_LON, COL_PRECISION = 0, 3, 6, 7, 8


class Command(BaseCommand):
    help = "Importe les coordonnees GPS des oeuvres depuis le document Word."

    def add_arguments(self, parser):
        parser.add_argument("--fichier", default=FICHIER_DEFAUT)
        parser.add_argument("--execute", action="store_true",
                            help="Applique l'import. Sans ce drapeau, rien n'est ecrit.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation explicite (comportement par defaut).")
        parser.add_argument("--forcer", action="store_true",
                            help="Ecrase la position des oeuvres qui en ont deja une.")

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]

        try:
            lignes = lignes_donnees(opts["fichier"], colonnes_min=8)
        except DocxIllisible as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{'IMPORT REEL' if execute else 'SIMULATION (aucune ecriture)'} — "
            f"{len(lignes)} ligne(s) lues dans {opts['fichier']}"))

        ecrits, deja, refuses = 0, 0, []
        points, precisions = {}, {}

        with transaction.atomic():
            for l in lignes:
                ident = int(l[COL_ID])
                oeuvre = Oeuvre.objects.filter(pk=ident).first()

                if oeuvre is None:
                    refuses.append(f"#{ident} \"{l[COL_NOM]}\" : aucune oeuvre a cet identifiant")
                    continue

                if normaliser(oeuvre.nom) != normaliser(l[COL_NOM]):
                    refuses.append(
                        f"#{ident} libelle divergent — document \"{l[COL_NOM]}\" "
                        f"vs base \"{oeuvre.nom}\"")
                    continue

                if not l[COL_LAT].strip() or not l[COL_LON].strip():
                    refuses.append(f"#{ident} \"{l[COL_NOM]}\" : coordonnee vide")
                    continue

                try:
                    lat, lon = flottant(l[COL_LAT]), flottant(l[COL_LON])
                except ValueError:
                    refuses.append(
                        f"#{ident} \"{l[COL_NOM]}\" : coordonnee illisible "
                        f"({l[COL_LAT]!r}, {l[COL_LON]!r})")
                    continue

                if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
                    refuses.append(
                        f"#{ident} \"{l[COL_NOM]}\" : {lat}, {lon} hors emprise du Cameroun")
                    continue

                if oeuvre.position is not None and not opts["forcer"]:
                    deja += 1
                    continue

                precision = (l[COL_PRECISION].strip() if len(l) > COL_PRECISION else "") or "non precisee"
                ancienne = oeuvre.position
                # GeoDjango attend Point(x, y) = Point(longitude, latitude).
                oeuvre.position = Point(lon, lat, srid=4326)
                oeuvre.save(update_fields=["position", "updated_at"])

                HistoriquePosition.objects.create(
                    type_objet="oeuvre",
                    objet_id=oeuvre.pk,
                    ancienne_position=ancienne,
                    nouvelle_position=oeuvre.position,
                    raison_changement=(
                        f"Import du document « oeuvres_sans_gps_ok.docx ». "
                        f"Precision declaree par la source : {precision}. "
                        "Position indicative, non relevee sur le batiment."),
                )

                points.setdefault((lat, lon), []).append(oeuvre.nom)
                precisions[precision.split(" (")[0]] = precisions.get(precision.split(" (")[0], 0) + 1
                ecrits += 1

            if not execute:
                transaction.set_rollback(True)

        self._resumer(ecrits, deja, refuses, points, precisions, execute)

    def _resumer(self, ecrits, deja, refuses, points, precisions, execute):
        partages = {k: v for k, v in points.items() if len(v) > 1}
        n_partagees = sum(len(v) for v in partages.values())

        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  positions ecrites               : {ecrits}")
        self.stdout.write(f"  deja situees, laissees intactes : {deja}")
        self.stdout.write(f"  lignes refusees                 : {len(refuses)}")
        for r in refuses:
            self.stdout.write(self.style.ERROR(f"      {r}"))

        if precisions:
            self.stdout.write("\n  precision declaree par la source :")
            for k, v in sorted(precisions.items(), key=lambda kv: -kv[1]):
                self.stdout.write(f"      {k:<14} {v}")

        self.stdout.write(f"\n  points distincts obtenus        : {len(points)}")
        self.stdout.write(self.style.WARNING(
            f"  oeuvres partageant un point     : {n_partagees} (sur {len(partages)} points)"))
        if partages:
            pire = max(partages.items(), key=lambda kv: len(kv[1]))
            self.stdout.write(
                f"  plus gros amas                  : {len(pire[1])} oeuvres "
                f"sur {pire[0][0]:.5f}, {pire[0][1]:.5f}")

        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
