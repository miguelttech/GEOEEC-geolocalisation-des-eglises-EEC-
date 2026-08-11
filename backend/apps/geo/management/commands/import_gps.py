"""
=============================================================================
CHEMIN   : backend/apps/geo/management/commands/import_gps.py
DÉPEND DE: apps/geo/models.py (Paroisse doit exister et être remplie)
DOIT ÊTRE EXÉCUTÉ APRÈS: import_paroisses.py
=============================================================================

OBJECTIF :
  Renseigner Paroisse.position à partir de la feuille « Projet de
  géolocalisation… » (Feuil1) du fichier Excel des paroisses.

POURQUOI UNE COMMANDE SÉPARÉE — ET POURQUOI FEUIL1 :
  Le classeur a deux feuilles :

    Feuil1 « Projet de géolocalisation… » : réponses brutes du formulaire.
      Le nom de la paroisse ET ses coordonnées sont sur la MÊME ligne, dans
      un bloc unique et cohérent. C'est la seule source fiable pour le GPS.

    Feuil2 : version nettoyée par l'EEC, utilisée par import_paroisses.py
      pour créer districts et paroisses (une ligne = une paroisse).
      PIÈGE : Feuil2 est composée de DEUX blocs juxtaposés qui ne sont PAS
      alignés ligne à ligne. Les colonnes 0-8 décrivent une paroisse ; les
      colonnes 9-13 (« Nom de la paroisse », « Quartier », « Coord_x »,
      « Coord_y », « Altitude ») sont un second bloc, copié depuis Feuil1
      dans son ordre d'origine. Lire le nom en colonne 4 et les coordonnées
      en colonnes 11-12 revient donc à attribuer à chaque paroisse le GPS
      d'une AUTRE paroisse.

  Mesuré sur les 22 polygones de régions synodales, en testant si le point
  d'une paroisse tombe bien dans sa propre région :

      coordonnées issues de Feuil2 (ancien import) :   6 % correctes
      coordonnées issues de Feuil1 (cette commande) :  84 % correctes

  Exemple concret du décalage : « Le Jourdain de beka hossere » (ADAMAOUA,
  région de Ngaoundéré) portait 3.808/11.507, qui sont les coordonnées de
  « AHALA-ECHANGEURS » à Yaoundé — soit 600 km d'erreur.

INVERSION DES COLONNES À LA SOURCE :
  Dans ce fichier, « Coord_x » contient la LATITUDE et « Coord_y » la
  LONGITUDE — l'inverse de la convention habituelle. On construit donc
  Point(longitude, latitude) = Point(Coord_y, Coord_x), car GeoDjango
  attend (x=longitude, y=latitude).

CONTRÔLES APPLIQUÉS AVANT ÉCRITURE :
  - le point doit tomber dans l'emprise du Cameroun ;
  - latitude == longitude est rejeté : ce sont des valeurs de remplissage
    du formulaire (12/12, 1.2/1.2) et non des positions réelles ;
  - si le point tombe hors de la région synodale de la paroisse, il est
    IMPORTÉ mais SIGNALÉ : ces cas relèvent soit d'une saisie GPS erronée,
    soit d'un mauvais rattachement de la paroisse à sa région, et seule
    l'EEC peut trancher.

ÉCRASEMENT :
  Par défaut la commande écrase les positions existantes — c'est son objet
  même, la base contenant des coordonnées issues du bloc désaligné.
  Utiliser --only-missing pour ne remplir que les paroisses sans position.

COMMANDE D'EXÉCUTION :
  docker compose exec backend python manage.py import_gps --dry-run
  docker compose exec backend python manage.py import_gps

OPTIONS :
  --dry-run       : simulation sans écriture en base
  --data-dir      : chemin vers le dossier data (défaut : /data)
  --only-missing  : ne renseigner que les paroisses sans position
=============================================================================
"""
import os
import re
import unicodedata

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from apps.geo.models import Paroisse

# Nom de la feuille des réponses brutes. Le titre est tronqué par Excel à
# 31 caractères : on le retrouve par préfixe plutôt qu'en dur.
PREFIXE_FEUILLE = "Projet de géolocalisation"

# Index des colonnes de Feuil1 (base 0) — bloc unique, nom et GPS alignés.
COL_REGION = 2
COL_DISTRICT = 4
COL_NOM = 5
COL_COORD_X = 11  # LATITUDE  (colonne mal nommée à la source)
COL_COORD_Y = 12  # LONGITUDE (colonne mal nommée à la source)

# Emprise du Cameroun, marge incluse. Sert de garde-fou : toute coordonnée
# hors de cette boîte est une erreur de saisie, pas une paroisse.
LAT_MIN, LAT_MAX = 1.6, 13.1
LON_MIN, LON_MAX = 8.4, 16.2


def norm(valeur: str) -> str:
    """Normalise un nom de paroisse pour la comparaison."""
    texte = unicodedata.normalize("NFD", str(valeur or ""))
    texte = texte.encode("ascii", "ignore").decode().lower()
    texte = re.sub(r"\bparoisse( de| du| d')?\b", " ", texte)
    texte = re.sub(r"\beec\b", " ", texte)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", texte).split())


def norm_region(valeur: str) -> str:
    """Normalise un nom de région (insensible à l'ordre des mots)."""
    texte = unicodedata.normalize("NFD", str(valeur or ""))
    texte = texte.encode("ascii", "ignore").decode().lower().replace("&", "et")
    texte = re.sub(r"[^a-z0-9]+", " ", texte)
    texte = re.sub(r"\bregion synodale (de la|de l|du|des|de)?\b", " ", texte)
    texte = texte.replace(" et ", " ")
    return " ".join(sorted(texte.split()))


def nombre(valeur) -> float | None:
    """Convertit une cellule en flottant. 0 et vide sont traités comme absents."""
    try:
        resultat = float(str(valeur).replace(",", ".").strip())
    except (TypeError, ValueError):
        return None
    return resultat if resultat != 0 else None


class Command(BaseCommand):
    help = "Renseigne les coordonnées GPS des paroisses depuis Feuil1 du fichier Excel"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulation : affiche le résultat sans rien écrire en base",
        )
        parser.add_argument(
            "--data-dir",
            default="/data",
            help="Dossier contenant le fichier Excel (défaut : /data)",
        )
        parser.add_argument(
            "--only-missing",
            action="store_true",
            help="Ne renseigner que les paroisses sans position (pas d'écrasement)",
        )
        parser.add_argument(
            "--purge-non-confirmees",
            action="store_true",
            help=(
                "Efface la position des paroisses absentes de Feuil1. Ces positions "
                "proviennent du bloc désaligné et sont fausses par construction "
                "(2 %% seulement tombent dans leur propre région)."
            ),
        )

    def handle(self, *args, **options):
        chemin = self._trouver_fichier(options["data_dir"])
        if not chemin:
            return

        feuille = self._ouvrir_feuille(chemin)
        if feuille is None:
            return

        self.stdout.write(f"Fichier : {os.path.basename(chemin)}")
        self._traiter(
            feuille,
            options["dry_run"],
            options["only_missing"],
            options["purge_non_confirmees"],
        )

    # ------------------------------------------------------------------
    def _trouver_fichier(self, data_dir):
        if not os.path.isdir(data_dir):
            self.stderr.write(self.style.ERROR(
                f"Dossier introuvable : {data_dir}. "
                "Verifiez que ./data est monte dans le conteneur (docker-compose.yml)."
            ))
            return None

        candidats = sorted(
            f for f in os.listdir(data_dir)
            if ("paroisse" in f.lower() or "geo" in f.lower())
            and f.lower().endswith((".xlsx", ".xlsm", ".xls"))
        )
        if not candidats:
            self.stderr.write(self.style.ERROR(f"Fichier paroisses introuvable dans {data_dir}"))
            return None
        return os.path.join(data_dir, candidats[0])

    def _ouvrir_feuille(self, chemin):
        import openpyxl

        classeur = openpyxl.load_workbook(chemin, read_only=True, data_only=True)
        for nom_feuille in classeur.sheetnames:
            if nom_feuille.startswith(PREFIXE_FEUILLE):
                return classeur[nom_feuille]

        self.stderr.write(self.style.ERROR(
            f"Feuille « {PREFIXE_FEUILLE}… » introuvable. "
            f"Feuilles presentes : {classeur.sheetnames}"
        ))
        return None

    # ------------------------------------------------------------------
    def _traiter(self, feuille, dry_run, only_missing, purger):
        # Index des paroisses par nom normalisé (plusieurs si homonymes)
        index = {}
        for paroisse in Paroisse.objects.select_related("district__region"):
            index.setdefault(norm(paroisse.nom), []).append(paroisse)

        a_ecrire = {}       # paroisse_id → (paroisse, Point, hors_region)
        nb_sans_coord = 0
        nb_absentes = 0
        nb_ambigues = 0
        nb_hors_cameroun = 0
        nb_remplissage = 0  # latitude == longitude : valeur bidon du formulaire
        nb_ignorees_existantes = 0
        hors_region = []

        for ligne in feuille.iter_rows(min_row=2, values_only=True):
            if len(ligne) <= COL_COORD_Y:
                continue

            nom = ligne[COL_NOM]
            if not nom:
                continue

            latitude = nombre(ligne[COL_COORD_X])
            longitude = nombre(ligne[COL_COORD_Y])
            if latitude is None or longitude is None:
                nb_sans_coord += 1
                continue

            # Garde-fou 1 : valeur de remplissage du formulaire (12/12, 1.2/1.2)
            if latitude == longitude:
                nb_remplissage += 1
                continue

            # Garde-fou 2 : emprise du Cameroun
            if not (LAT_MIN <= latitude <= LAT_MAX and LON_MIN <= longitude <= LON_MAX):
                nb_hors_cameroun += 1
                continue

            candidates = index.get(norm(nom))
            if not candidates:
                nb_absentes += 1
                continue

            # Homonymes : la région du document les départage
            if len(candidates) > 1:
                memes = [p for p in candidates
                         if norm_region(p.district.region.nom) == norm_region(ligne[COL_REGION])]
                if len(memes) != 1:
                    nb_ambigues += 1
                    continue
                candidates = memes

            paroisse = candidates[0]

            if only_missing and paroisse.position is not None:
                nb_ignorees_existantes += 1
                continue
            # Le formulaire contient des doublons : la première ligne gagne
            if paroisse.id in a_ecrire:
                continue

            point = Point(longitude, latitude, srid=4326)

            # Contrôle de cohérence : le point tombe-t-il dans sa région ?
            # On n'écarte pas — on signale, car l'erreur peut venir du GPS
            # comme du rattachement de la paroisse à sa région.
            geometrie = paroisse.district.region.geometrie
            dehors = bool(geometrie) and not geometrie.contains(point)
            if dehors:
                hors_region.append(
                    f"{paroisse.nom[:30]:32s} {paroisse.district.region.nom[:18]:20s} "
                    f"{latitude:.3f}/{longitude:.3f}"
                )

            a_ecrire[paroisse.id] = (paroisse, point, dehors)

        # Positions présentes en base qu'aucune ligne de Feuil1 ne confirme :
        # elles viennent forcément de l'ancien import via le bloc désaligné.
        a_purger = [
            p for p in Paroisse.objects.exclude(position__isnull=True)
            if p.id not in a_ecrire
        ] if purger else []

        self._afficher_bilan(
            a_ecrire, hors_region, nb_sans_coord, nb_absentes, nb_ambigues,
            nb_hors_cameroun, nb_remplissage, nb_ignorees_existantes, only_missing,
            a_purger, purger,
        )

        if dry_run:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("SIMULATION — aucune ecriture en base."))
            return

        nb_ecrites = 0
        for paroisse, point, _ in a_ecrire.values():
            if paroisse.position is None or not paroisse.position.equals_exact(point, 1e-9):
                paroisse.position = point
                paroisse.save(update_fields=["position"])
                nb_ecrites += 1

        nb_purgees = 0
        for paroisse in a_purger:
            paroisse.position = None
            paroisse.save(update_fields=["position"])
            nb_purgees += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"ECRIT : {nb_ecrites} positions mises a jour"))
        if purger:
            self.stdout.write(self.style.SUCCESS(f"PURGE : {nb_purgees} positions non confirmees effacees"))

    # ------------------------------------------------------------------
    def _afficher_bilan(self, a_ecrire, hors_region, nb_sans_coord, nb_absentes,
                        nb_ambigues, nb_hors_cameroun, nb_remplissage,
                        nb_ignorees_existantes, only_missing, a_purger, purger):
        total = Paroisse.objects.count()
        dedans = len(a_ecrire) - len(hors_region)

        self.stdout.write("")
        self.stdout.write("=" * 62)
        self.stdout.write(self.style.SUCCESS("IMPORT GPS (source : Feuil1, bloc nom+coordonnees aligne)"))
        self.stdout.write(f"  Positions retenues : {len(a_ecrire)} / {total} paroisses")
        self.stdout.write(
            f"    dans leur region synodale : {dedans} "
            f"({dedans * 100 // max(len(a_ecrire), 1)} %)"
        )
        self.stdout.write(f"    hors de leur region       : {len(hors_region)}")
        self.stdout.write("")
        self.stdout.write(f"  Ecartees - lignes sans coordonnees : {nb_sans_coord}")
        self.stdout.write(f"  Ecartees - valeur de remplissage   : {nb_remplissage} (latitude == longitude)")
        self.stdout.write(f"  Ecartees - hors emprise Cameroun   : {nb_hors_cameroun}")
        self.stdout.write(f"  Ecartees - nom absent de la base   : {nb_absentes}")
        self.stdout.write(f"  Ecartees - homonymes ambigus       : {nb_ambigues}")
        if only_missing:
            self.stdout.write(f"  Ecartees - position deja presente  : {nb_ignorees_existantes}")

        if purger:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(
                f"  A PURGER : {len(a_purger)} positions qu'aucune ligne de Feuil1 ne confirme"
            ))

        if hors_region:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(
                "  Points hors de leur region synodale — importes mais a verifier"
            ))
            self.stdout.write(self.style.WARNING(
                "  (GPS errone a la saisie, ou paroisse rattachee a la mauvaise region) :"
            ))
            for ligne in hors_region[:15]:
                self.stdout.write(f"      ! {ligne}")
            if len(hors_region) > 15:
                self.stdout.write(f"      … et {len(hors_region) - 15} autres")
