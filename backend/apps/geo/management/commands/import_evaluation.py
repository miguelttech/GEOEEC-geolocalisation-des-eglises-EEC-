"""
=============================================================================
CHEMIN   : backend/apps/geo/management/commands/import_evaluation.py
DÉPEND DE: apps/geo/models.py, apps/accounts/models.py
DOIT ÊTRE EXÉCUTÉ APRÈS: import_paroisses.py
=============================================================================

OBJECTIF :
  Importer les deux grandeurs de la matrice d'évaluation du Conseil Synodal
  (« Catégorisation paroisses EEC 050826.docx ») :
    - la CIBLE D'OFFRANDE annuelle, en FCFA        → Paroisse.cible_offrande
    - l'EFFECTIF DE FIDÈLES de l'évaluation        → StatistiqueAnnuelle

  Ce sont les deux entrées du calcul de catégorie : la matrice attribue un
  poids économique à la première, un poids démographique au second, et leur
  somme donne la note globale dont découle la catégorie (voir
  Paroisse.CATEGORIES_RANG). Les catégories elles-mêmes sont importées
  séparément par import_categories.

POURQUOI UNE ANNÉE DISTINCTE, ET NON UN ÉCRASEMENT :
  Les effectifs de ce document ne recoupent PAS ceux déjà en base. Sur les
  265 paroisses appariées lors de la mise au point, les 265 différaient — dans
  les deux sens, parfois du simple au triple. Ce ne sont donc pas des
  corrections d'une même mesure mais DEUX CAMPAGNES DISTINCTES :

    enquête de terrain 2025 : ventilée communiants / non-communiants
    évaluation synodale 2026 : effectif global, sans ventilation

  Écraser l'une par l'autre détruirait une source sans possibilité de retour.
  On enregistre donc une StatistiqueAnnuelle d'une AUTRE ANNÉE, ce que le
  modèle prévoit déjà (clé unique paroisse + année). Les deux séries
  coexistent, et Paroisse.nombre_fideles est recalculé sur l'année la plus
  récente disponible pour chaque paroisse.

  Le total est écrit dans `total_declare` et non réparti entre communiants et
  non-communiants : la source ne donne pas cette ventilation, et l'inventer
  serait fabriquer de la donnée.

COMMANDE D'EXÉCUTION :
  docker compose exec backend python manage.py import_evaluation --dry-run
  docker compose exec backend python manage.py import_evaluation

OPTIONS :
  --dry-run  : simulation sans écriture en base
  --data-dir : chemin vers le dossier data (défaut : /data)
  --annee    : année de rattachement de l'évaluation (défaut : 2026)
=============================================================================
"""
import os
import re
import unicodedata

from django.core.management.base import BaseCommand
from django.db.models import Max

from apps.accounts.models import StatistiqueAnnuelle
from apps.geo.models import Paroisse

# Indices de colonnes de la matrice (base 0)
COL_NOM, COL_OFFRANDE, COL_FIDELES = 0, 1, 4
NB_COLONNES_MATRICE = 9


def norm(valeur: str) -> str:
    """Normalise un nom pour la comparaison (voir import_categories)."""
    texte = unicodedata.normalize("NFD", str(valeur or ""))
    texte = texte.encode("ascii", "ignore").decode().lower()
    texte = re.sub(r"\bparoisse( de| du| d')?\b", " ", texte)
    texte = re.sub(r"\beec\b", " ", texte)
    texte = " ".join(re.sub(r"[^a-z0-9]+", " ", texte).split())
    for romain, arabe in ((" i", " 1"), (" ii", " 2"), (" iii", " 3")):
        if texte.endswith(romain):
            texte = texte[: -len(romain)] + arabe
    return re.sub(r"\s+(\d)$", r"\1", texte)


def norm_region(valeur: str) -> str:
    texte = unicodedata.normalize("NFD", str(valeur or ""))
    texte = texte.encode("ascii", "ignore").decode().lower().replace("&", "et")
    texte = re.sub(r"[^a-z0-9]+", " ", texte)
    texte = re.sub(r"\bregion synodale (de la|de l|du|des|de)?\b", " ", texte)
    return " ".join(sorted(texte.replace(" et ", " ").split()))


def entier(valeur):
    """Extrait un entier d'une cellule (« 2 500 000 », « 1 145 000 FCFA »…)."""
    chiffres = re.sub(r"[^\d]", "", str(valeur or ""))
    return int(chiffres) if chiffres else None


class Command(BaseCommand):
    help = "Importe cibles d'offrande et effectifs depuis la matrice d'évaluation du Conseil Synodal"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation : affiche le résultat sans rien écrire")
        parser.add_argument("--data-dir", default="/data",
                            help="Dossier contenant le document (défaut : /data)")
        parser.add_argument("--annee", type=int, default=2026,
                            help="Année de rattachement de l'évaluation (défaut : 2026)")

    def handle(self, *args, **options):
        chemin = self._trouver_matrice(options["data_dir"])
        if not chemin:
            return

        lignes = self._lire_matrice(chemin)
        if not lignes:
            self.stderr.write(self.style.ERROR("Aucune ligne exploitable dans le document."))
            return

        self.stdout.write(f"Document : {os.path.basename(chemin)}")
        self.stdout.write(f"Lignes de paroisse lues : {len(lignes)}")
        self._apparier_et_ecrire(lignes, options["annee"], options["dry_run"])

    # ------------------------------------------------------------------
    def _trouver_matrice(self, data_dir):
        """Retrouve le document au format matrice parmi les .docx de data_dir."""
        if not os.path.isdir(data_dir):
            self.stderr.write(self.style.ERROR(
                f"Dossier introuvable : {data_dir}. "
                "Verifiez que ./data est monte dans le conteneur (docker-compose.yml)."
            ))
            return None

        try:
            from docx import Document
        except ImportError:
            self.stderr.write(self.style.ERROR(
                "python-docx absent. Installez les dependances : pip install -r requirements.txt"
            ))
            return None

        def sans_accent(nom):
            return unicodedata.normalize("NFD", nom).encode("ascii", "ignore").decode().lower()

        for nom in sorted(os.listdir(data_dir)):
            if not nom.lower().endswith(".docx") or "categoris" not in sans_accent(nom):
                continue
            chemin = os.path.join(data_dir, nom)
            try:
                document = Document(chemin)
            except Exception:
                continue
            if not document.tables:
                continue
            # La matrice se reconnaît à l'en-tête de son premier tableau.
            entetes = " ".join(c.text.upper() for c in document.tables[0].rows[0].cells)
            if "PAROISSES" in entetes and "EFFECTIFS" in entetes:
                return chemin

        self.stderr.write(self.style.ERROR(
            f"Aucun document au format « matrice d'evaluation » trouve dans {data_dir}"
        ))
        return None

    # ------------------------------------------------------------------
    def _lire_matrice(self, chemin):
        """Extrait (région, district, paroisse, offrande, effectif)."""
        from docx import Document
        from docx.document import Document as _Doc
        from docx.oxml.ns import qn
        from docx.table import Table
        from docx.text.paragraph import Paragraph

        def blocs(doc: _Doc):
            for enfant in doc.element.body.iterchildren():
                if enfant.tag == qn("w:p"):
                    yield Paragraph(enfant, doc)
                elif enfant.tag == qn("w:tbl"):
                    yield Table(enfant, doc)

        lignes = []
        region = None
        for bloc in blocs(Document(chemin)):
            if isinstance(bloc, Paragraph):
                titre = re.match(r"^IV\.\d+\s+(.*)$", bloc.text.strip())
                if titre and "REGION" in titre.group(1).upper():
                    region = titre.group(1).strip()
                continue

            district = None
            for rang in bloc.rows[1:]:                     # ligne 0 = en-têtes
                cellules = [c.text.strip() for c in rang.cells]
                if len(cellules) < NB_COLONNES_MATRICE:
                    continue
                nom = cellules[COL_NOM]
                if not nom or nom.upper().startswith("TOTAL"):
                    continue
                # Ligne dont seule la première cellule est remplie : c'est le
                # district auquel se rattachent les lignes suivantes.
                if not any(cellules[1:]):
                    district = nom
                    continue
                lignes.append({
                    "region": region,
                    "district": district,
                    "paroisse": nom,
                    "offrande": entier(cellules[COL_OFFRANDE]),
                    "fideles": entier(cellules[COL_FIDELES]),
                })
        return lignes

    # ------------------------------------------------------------------
    def _apparier_et_ecrire(self, lignes, annee, dry_run):
        index = {}
        for paroisse in Paroisse.objects.select_related("district__region"):
            index.setdefault(norm(paroisse.nom), []).append(paroisse)

        retenues = {}       # paroisse_id → (paroisse, offrande, fideles)
        nb_absentes = nb_region_ko = nb_ambigues = nb_doublons = 0

        for ligne in lignes:
            candidates = index.get(norm(ligne["paroisse"]))
            if not candidates:
                nb_absentes += 1
                continue

            if len(candidates) > 1:
                memes = [p for p in candidates
                         if norm_region(p.district.region.nom) == norm_region(ligne["region"])]
                # Deux homonymes d'une même région ne se départagent que par
                # leur district — que ce document fournit.
                if len(memes) > 1 and ligne["district"]:
                    par_district = [p for p in memes
                                    if norm(p.district.nom) == norm(ligne["district"])]
                    if len(par_district) == 1:
                        memes = par_district
                if len(memes) != 1:
                    nb_ambigues += 1
                    continue
                candidates = memes

            paroisse = candidates[0]
            if norm_region(paroisse.district.region.nom) != norm_region(ligne["region"]):
                nb_region_ko += 1
                continue
            if paroisse.id in retenues:
                nb_doublons += 1
                continue

            retenues[paroisse.id] = (paroisse, ligne["offrande"], ligne["fideles"])

        self._afficher_bilan(retenues, annee, nb_absentes, nb_region_ko,
                             nb_ambigues, nb_doublons)

        if dry_run:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("SIMULATION — aucune ecriture en base."))
            return

        nb_offrandes = nb_stats = 0
        for paroisse, offrande, fideles in retenues.values():
            if offrande is not None and paroisse.cible_offrande != offrande:
                paroisse.cible_offrande = offrande
                paroisse.save(update_fields=["cible_offrande"])
                nb_offrandes += 1

            if fideles is not None:
                # update_or_create() écrit à chaque passage ; on ne compte que
                # les changements réels, sinon le bilan annoncerait 263
                # écritures là où la commande est en fait sans effet.
                stat, cree = StatistiqueAnnuelle.objects.get_or_create(
                    paroisse=paroisse, annee=annee,
                    defaults={"total_declare": fideles},
                )
                if cree:
                    nb_stats += 1
                elif stat.total_declare != fideles:
                    stat.total_declare = fideles
                    stat.save(update_fields=["total_declare"])
                    nb_stats += 1

        nb_recalcules = self._recalculer_nombre_fideles()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"ECRIT : {nb_offrandes} cibles d'offrande, {nb_stats} statistiques {annee}, "
            f"{nb_recalcules} effectifs de paroisse recalcules"
        ))

    # ------------------------------------------------------------------
    def _recalculer_nombre_fideles(self):
        """Aligne Paroisse.nombre_fideles sur l'année la plus récente connue.

        Ce champ est la dénormalisation de l'effectif courant : il doit suivre
        la dernière campagne disponible POUR CHAQUE paroisse, sans quoi une
        paroisse absente de l'évaluation 2026 se retrouverait avec un effectif
        plus récent qu'une paroisse qui y figure.
        """
        derniere = {
            r["paroisse"]: r["max_annee"]
            for r in StatistiqueAnnuelle.objects.values("paroisse").annotate(max_annee=Max("annee"))
        }
        nb = 0
        stats = StatistiqueAnnuelle.objects.select_related("paroisse")
        for stat in stats:
            if derniere.get(stat.paroisse_id) != stat.annee:
                continue
            total = (stat.total_declare
                     if stat.total_declare is not None
                     else (stat.communiants or 0) + (stat.non_communiants or 0))
            if stat.paroisse.nombre_fideles != total:
                stat.paroisse.nombre_fideles = total
                stat.paroisse.save(update_fields=["nombre_fideles"])
                nb += 1
        return nb

    # ------------------------------------------------------------------
    def _afficher_bilan(self, retenues, annee, nb_absentes, nb_region_ko,
                        nb_ambigues, nb_doublons):
        total = Paroisse.objects.count()
        avec_offrande = sum(1 for _, o, _ in retenues.values() if o is not None)
        avec_fideles = sum(1 for _, _, f in retenues.values() if f is not None)
        somme = sum(o for _, o, _ in retenues.values() if o)

        self.stdout.write("")
        self.stdout.write("=" * 62)
        self.stdout.write(self.style.SUCCESS(
            f"IMPORT EVALUATION SYNODALE — annee {annee}"
        ))
        self.stdout.write(f"  Paroisses appariees : {len(retenues)} / {total} "
                          f"({len(retenues) * 100 // max(total, 1)} %)")
        self.stdout.write(f"    avec cible d'offrande : {avec_offrande}")
        self.stdout.write(f"    avec effectif         : {avec_fideles}")
        self.stdout.write(f"    total des cibles      : {somme:,} FCFA".replace(",", " "))
        self.stdout.write("")
        self.stdout.write(f"  Non appariees - nom absent de la base : {nb_absentes}")
        self.stdout.write(f"  Non appariees - region discordante    : {nb_region_ko}")
        self.stdout.write(f"  Non appariees - homonymes ambigus     : {nb_ambigues}")
        self.stdout.write(f"  Lignes en double dans le document     : {nb_doublons}")
