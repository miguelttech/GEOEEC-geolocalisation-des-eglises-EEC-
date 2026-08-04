"""
=============================================================================
CHEMIN   : backend/apps/geo/management/commands/import_categories.py
DÉPEND DE: apps/geo/models.py (Paroisse.categorie doit exister)
DOIT ÊTRE EXÉCUTÉ APRÈS: import_paroisses.py
=============================================================================

OBJECTIF :
  Renseigner Paroisse.categorie à partir du document officiel du Conseil
  Synodal Général (« Catégorisation des paroisses par région », résolution
  n° R05/CSG de juillet 2024), fourni au format .docx.

QU'EST-CE QU'UNE CATÉGORIE ?
  Un classement officiel des paroisses de l'EEC, de A++ (les plus grandes)
  à C4. Ce n'est pas une statistique calculée : c'est une DÉCISION du
  Conseil Synodal. Une catégorie erronée est donc une erreur de gouvernance,
  pas une simple imprécision de données — d'où la prudence de l'appariement
  ci-dessous.

STRUCTURE DU DOCUMENT SOURCE :
  Des tableaux dont la première colonne porte la catégorie et dont chaque
  autre colonne porte une région synodale en en-tête. Une cellule peut
  contenir plusieurs paroisses, séparées par « ; » ou par un retour ligne.

POURQUOI UN APPARIEMENT STRICT (ET PAS APPROCHÉ) :
  Les noms de paroisses du document ne coïncident pas toujours avec ceux de
  la base. La tentation est d'utiliser un rapprochement orthographique
  (difflib) — c'est ce que faisait le script d'audit data_audit/
  integrate_categories.py. Mesuré sur ce jeu de données, il produit des
  affectations FAUSSES et indétectables après coup :

      « Ngoulmekong I »  rapproché de « NGOULMEKONG II »   (0.96)
      « Nkoldongo II »   rapproché de « NKOLNDONGO I »     (0.92)
      « Fongo Tongo I »  rapproché de « FONGO-TONGO II »   (0.96)
      « Bamendou »       rapproché de « Bamendjou »        (0.94)

  Deux localités distinctes se ressemblent plus que deux orthographes de la
  même. On n'apparie donc QUE sur nom exact normalisé + région concordante.
  Les paroisses non appariées gardent categorie=NULL et s'affichent « — » :
  une case vide est corrigeable, une catégorie fausse ne se voit pas.

NORMALISATION APPLIQUÉE AUX NOMS :
  Accents supprimés, casse ignorée, ponctuation réduite, préfixes « Paroisse
  de » et « EEC » retirés, et chiffres romains de fin convertis (I→1, II→2)
  pour que « Nkolndongo II » et « nkoLndongo 2 » soient reconnus identiques.

COMMANDE D'EXÉCUTION :
  docker compose exec backend python manage.py import_categories --dry-run
  docker compose exec backend python manage.py import_categories

OPTIONS :
  --dry-run  : simulation sans écriture en base
  --data-dir : chemin vers le dossier data (défaut : /data)
=============================================================================
"""
import os
import re
import unicodedata
from collections import Counter, defaultdict

from django.core.management.base import BaseCommand

from apps.geo.models import Paroisse

# Catégories officielles admises (résolution R05/CSG). Toute autre valeur
# lue dans le document est ignorée : les tableaux contiennent aussi des
# lignes de titre et des cellules de mise en forme.
CATEGORIES_VALIDES = {"A++", "A1", "A2", "B1", "B2", "C1", "C2", "C3", "C4"}


def norm(valeur: str) -> str:
    """Normalise un nom de paroisse pour la comparaison.

    « PAROISSE DE NKOLNDONGO I » et « nkoLndongo 2 » deviennent
    respectivement « nkolndongo1 » et « nkolndongo2 » — donc comparables,
    et surtout DISTINCTS l'un de l'autre.
    """
    texte = unicodedata.normalize("NFD", str(valeur or ""))
    texte = texte.encode("ascii", "ignore").decode().lower()
    texte = re.sub(r"\bparoisse( de| du| d')?\b", " ", texte)
    texte = re.sub(r"\beec\b", " ", texte)
    texte = " ".join(re.sub(r"[^a-z0-9]+", " ", texte).split())

    # Chiffres romains de fin → chiffres arabes, pour que « Ngoulmekong I »
    # et « Ngoulmekong1 » se rejoignent sans confondre I et II.
    for romain, arabe in ((" i", " 1"), (" ii", " 2"), (" iii", " 3")):
        if texte.endswith(romain):
            texte = texte[: -len(romain)] + arabe

    # Colle le chiffre final au mot : « nkolndongo 2 » → « nkolndongo2 »
    return re.sub(r"\s+(\d)$", r"\1", texte)


def norm_region(valeur: str) -> str:
    """Normalise un nom de région synodale.

    Le document et la base divergent sur l'habillage (« Région synodale du
    NOUN NORD » vs « NOUN NORD ») et sur l'ordre des mots (« SANAGA MARITIME
    ET OCEAN » vs « OCEAN ET SANAGA MARITIME »). On retire l'habillage puis
    on trie les mots : la comparaison devient insensible à l'ordre.
    """
    texte = unicodedata.normalize("NFD", str(valeur or ""))
    texte = texte.encode("ascii", "ignore").decode().lower().replace("&", "et")
    texte = re.sub(r"[^a-z0-9]+", " ", texte)
    texte = re.sub(r"\bregion synodale (de la|de l|du|des|de)?\b", " ", texte)
    texte = texte.replace(" et ", " ")
    return " ".join(sorted(texte.split()))


class Command(BaseCommand):
    help = "Importe les catégories officielles des paroisses depuis le .docx du Conseil Synodal"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulation : affiche le résultat sans rien écrire en base",
        )
        parser.add_argument(
            "--data-dir",
            default="/data",
            help="Dossier contenant le document .docx (défaut : /data)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        data_dir = options["data_dir"]

        chemin = self._trouver_document(data_dir)
        if not chemin:
            return

        lignes = self._lire_document(chemin)
        if not lignes:
            self.stderr.write(self.style.ERROR("Aucune catégorie lisible dans le document."))
            return

        self.stdout.write(f"Document : {os.path.basename(chemin)}")
        self.stdout.write(f"Lignes categorisees lues : {len(lignes)}")

        self._apparier_et_ecrire(lignes, dry_run)

    # ------------------------------------------------------------------
    # ÉTAPE 1 : localiser le document
    # ------------------------------------------------------------------
    def _trouver_document(self, data_dir):
        """Retrouve le .docx « catégorisation ... par région » dans data_dir.

        Le dossier contient plusieurs .docx dont les noms se ressemblent :
        on exige « categoris » ET « region » (accents ignorés) pour écarter
        le document de catégorisation SANS région, qui ne permettrait pas de
        départager les homonymes.
        """
        if not os.path.isdir(data_dir):
            self.stderr.write(self.style.ERROR(
                f"Dossier introuvable : {data_dir}. "
                "Verifiez que ./data est monte dans le conteneur (docker-compose.yml)."
            ))
            return None

        def sans_accent(nom):
            return unicodedata.normalize("NFD", nom).encode("ascii", "ignore").decode().lower()

        candidats = sorted(
            f for f in os.listdir(data_dir)
            if f.lower().endswith(".docx")
            and "categoris" in sans_accent(f)
            and "region" in sans_accent(f)
        )
        if not candidats:
            self.stderr.write(self.style.ERROR(
                f"Document de categorisation par region introuvable dans {data_dir}"
            ))
            return None
        return os.path.join(data_dir, candidats[0])

    # ------------------------------------------------------------------
    # ÉTAPE 2 : extraire (catégorie, région, paroisse) du .docx
    # ------------------------------------------------------------------
    def _lire_document(self, chemin):
        """Parcourt les tableaux : colonne 0 = catégorie, en-têtes = régions."""
        try:
            from docx import Document
        except ImportError:
            self.stderr.write(self.style.ERROR(
                "python-docx absent. Installez les dependances : pip install -r requirements.txt"
            ))
            return []

        document = Document(chemin)
        lignes = []

        for tableau in document.tables:
            entetes = [cellule.text.strip() for cellule in tableau.rows[0].cells]

            for rang in tableau.rows[1:]:
                cellules = rang.cells
                categorie = cellules[0].text.strip().upper()
                if categorie not in CATEGORIES_VALIDES:
                    continue  # ligne de titre ou cellule de mise en forme

                # Colonne 0 = catégorie ; colonnes suivantes = une par région
                for indice in range(1, min(len(entetes), len(cellules))):
                    region = entetes[indice]
                    for paragraphe in cellules[indice].paragraphs:
                        texte = paragraphe.text.strip()
                        if not texte:
                            continue
                        # Une cellule peut lister plusieurs paroisses
                        for morceau in re.split(r"[;\n]| {2,}", texte):
                            nom = morceau.strip(" \xa0;-")
                            if nom and nom != "-":
                                lignes.append((categorie, region, nom))
        return lignes

    # ------------------------------------------------------------------
    # ÉTAPE 3 : apparier puis écrire
    # ------------------------------------------------------------------
    def _apparier_et_ecrire(self, lignes, dry_run):
        # Index des paroisses par nom normalisé. Une clé peut porter
        # plusieurs paroisses (homonymes dans des régions différentes).
        index = defaultdict(list)
        for paroisse in Paroisse.objects.select_related("district__region"):
            index[norm(paroisse.nom)].append(paroisse)

        retenues = {}          # paroisse_id → (paroisse, categorie)
        nb_absentes = 0        # nom du document inconnu de la base
        nb_region_ko = 0       # nom trouvé mais dans une autre région
        nb_ambigues = 0        # homonymes que la région ne départage pas
        conflits = []          # même paroisse, deux catégories dans le document

        for categorie, region_doc, nom_doc in lignes:
            candidates = index.get(norm(nom_doc))
            if not candidates:
                nb_absentes += 1
                continue

            # Homonymes : seule la région peut trancher
            if len(candidates) > 1:
                memes = [p for p in candidates
                         if norm_region(p.district.region.nom) == norm_region(region_doc)]
                if len(memes) != 1:
                    nb_ambigues += 1
                    continue
                candidates = memes

            paroisse = candidates[0]

            # Garde-fou : le nom concorde, mais la région doit concorder aussi
            if norm_region(paroisse.district.region.nom) != norm_region(region_doc):
                nb_region_ko += 1
                continue

            # Le document lui-même peut se contredire (même paroisse citée
            # deux fois avec deux catégories) : on n'arbitre pas, on signale.
            if paroisse.id in retenues and retenues[paroisse.id][1] != categorie:
                conflits.append(f"{paroisse.nom} : {retenues[paroisse.id][1]} vs {categorie}")
                continue

            retenues[paroisse.id] = (paroisse, categorie)

        self._afficher_bilan(retenues, nb_absentes, nb_region_ko, nb_ambigues, conflits)

        if dry_run:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("SIMULATION — aucune ecriture en base."))
            return

        # On n'écrit que si la valeur change : évite des UPDATE inutiles et
        # rend la commande rejouable sans effet de bord.
        nb_ecrites = 0
        for paroisse, categorie in retenues.values():
            if paroisse.categorie != categorie:
                paroisse.categorie = categorie
                paroisse.save(update_fields=["categorie"])
                nb_ecrites += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"ECRIT : {nb_ecrites} categories mises a jour"))

    def _afficher_bilan(self, retenues, nb_absentes, nb_region_ko, nb_ambigues, conflits):
        total = Paroisse.objects.count()
        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("IMPORT CATEGORIES (appariement strict)"))
        self.stdout.write(
            f"  Appariees sans ambiguite : {len(retenues)} / {total} paroisses "
            f"({len(retenues) * 100 // max(total, 1)} %)"
        )
        self.stdout.write("")
        self.stdout.write(f"  Non appariees - nom absent de la base : {nb_absentes}")
        self.stdout.write(f"  Non appariees - region discordante    : {nb_region_ko}")
        self.stdout.write(f"  Non appariees - homonymes ambigus     : {nb_ambigues}")
        self.stdout.write(f"  Non appariees - conflits dans le doc  : {len(conflits)}")

        # Les conflits viennent du document officiel, pas de l'appariement :
        # seul le Conseil Synodal peut les trancher. On les liste toujours.
        for conflit in conflits:
            self.stdout.write(self.style.WARNING(f"      ! {conflit}"))

        if retenues:
            self.stdout.write("")
            self.stdout.write("  Repartition des categories attribuees :")
            for categorie, nombre in sorted(Counter(c for _, c in retenues.values()).items()):
                self.stdout.write(f"     {categorie:4s} : {nombre:4d}")
