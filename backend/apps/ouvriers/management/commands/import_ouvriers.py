"""
=============================================================================
FICHIER N°7 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/ouvriers/management/commands/import_ouvriers.py
CRÉÉ     : Phase 2 — Import des données
DÉPEND DE: apps/ouvriers/management/commands/import_grades.py
           apps/geo/models.py (Paroisse, District)
           apps/ouvriers/models.py (Grade, Ouvrier)
DOIT ÊTRE EXÉCUTÉ APRÈS: import_grades.py (les grades doivent exister en base)
=============================================================================

OBJECTIF :
  Lire le fichier OUVRIERS.xlsx et créer les 685 ouvriers de l'EEC
  dans la base de données PostgreSQL, en les associant à leur paroisse
  et à leur grade ecclésiastique.

QU'EST-CE QU'UN OUVRIER DANS L'EEC ?
  Un "ouvrier" est tout agent de l'Église Évangélique du Cameroun qui
  exerce un ministère : pasteurs, évangélistes, délégués pastoraux, etc.
  Ce terme vient de la Bible (Luc 10:2 : "La moisson est grande, mais
  les ouvriers sont peu nombreux").

STRUCTURE DU FICHIER EXCEL (OUVRIERS.xlsx — Feuille "Sheet1") :
  Le fichier contient 708 lignes de données (en-tête ligne 1 exclue).
  Chaque ligne représente UN ouvrier individuel avec ses informations.
  Les colonnes utilisées sont :
  ┌───────┬────────────────────────────────────────────────────────┐
  │ Index │ Contenu                                                 │
  ├───────┼────────────────────────────────────────────────────────┤
  │  [1]  │ Région synodale (ex: "ADAMAOUA")                       │
  │  [2]  │ District (ex: "NGAOUNDERE")                            │
  │  [3]  │ Nom de la paroisse (ex: "BIKOP")                       │
  │  [21] │ Nom complet de l'ouvrier (ex: "TAKAM Roger Ernest")    │
  │  [22] │ Grade en texte libre (ex: "Pasteur", "Ev", "dp")       │
  │  [23] │ Contact/téléphone (ex: "677123456")                    │
  └───────┴────────────────────────────────────────────────────────┘

PROBLÈME DU TEXTE LIBRE POUR LES GRADES :
  La colonne [22] "Grade" n'est pas standardisée. Les agents de saisie
  ont écrit le grade de différentes façons :
  - "Pasteur", "pasteur", "PASTEUR", "Rév.", "Rev.", "Rev", "P."
  - "Ev", "Ev.", "Evangéliste", "Evangeliste", "Év."
  - "Dp", "D.P.", "Délégué", "delegue pastoral"
  - "PP", "P.P.", "Pasteur Proposant"
  - "PPDP", "P.P.D.P.", "Pasteur Proposant avec DP"
  - Et beaucoup d'autres variations...
  → On utilise la fonction mapper_grade() qui reconnaît les mots-clés.

CORRESPONDANCE PAROISSE :
  Pour rattacher un ouvrier à sa paroisse, on cherche dans la base de
  données en combinant (nom du district + nom de la paroisse).
  Si cette combinaison ne trouve rien, on essaie juste le nom de la
  paroisse (utile si le district est mal orthographié dans Excel).

DÉDUPLICATION (éviter les doublons) :
  Si le même ouvrier est importé deux fois (par exemple après une
  correction du fichier Excel), on évite les doublons en cherchant
  d'abord si un ouvrier avec (paroisse + nom) existe déjà.
  → Existe déjà : mise à jour des informations
  → N'existe pas : création

RÉSULTATS OBTENUS LORS DE L'IMPORT INITIAL :
  - 685 ouvriers importés avec succès
  - 23 lignes sans nom d'ouvrier (ignorées)
  - 129 ouvriers sans grade reconnu (importés quand même, grade=None)

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_ouvriers

OPTION DRY-RUN (simulation) :
  docker compose run --rm backend python manage.py import_ouvriers --dry-run
  → Affiche ce qui SERAIT créé, sans rien écrire en base.
  → Très utile pour tester avant d'importer réellement.
=============================================================================
"""

# os : module Python standard pour les opérations sur les fichiers
# os.path.join() : crée un chemin selon le système d'exploitation
# os.listdir()   : liste les fichiers d'un dossier
import os

# re : module Python pour les "expressions régulières"
# Une expression régulière est un pattern (modèle) pour trouver du texte.
# Exemple : re.search(r"^ev\b", "ev") trouve "ev" en début de chaîne.
# On l'utilise pour reconnaître les abréviations de grades dans le texte libre.
import re

# openpyxl : bibliothèque Python pour lire les fichiers Excel (.xlsx)
# Installée via requirements.txt.
# load_workbook() : ouvre un fichier Excel
# iter_rows() : lit les lignes du tableau Excel
import openpyxl

# BaseCommand : classe de base que toute commande de gestion Django doit hériter
# Donne accès à self.stdout, self.stderr, self.style (couleurs terminal)
from django.core.management.base import BaseCommand

# Paroisse : le modèle de la table des paroisses
# On en a besoin pour retrouver à quelle paroisse appartient chaque ouvrier
from apps.geo.models import Paroisse

# Grade  : les 8 grades ecclésiastiques (créés par import_grades.py)
# Ouvrier: le modèle de la table des ouvriers (celui qu'on va remplir)
from apps.ouvriers.models import Grade, Ouvrier


# =============================================================================
# INDEX DES COLONNES DANS LE FICHIER EXCEL
#
# Python utilise des indices commençant à 0, mais dans Excel les colonnes
# commencent à 1. Pour éviter la confusion, on nomme les indices.
#
# ATTENTION : Ces indices viennent d'une analyse manuelle du fichier Excel.
# Si le fichier Excel change de structure, ces constantes doivent être mises à jour.
# =============================================================================

# COL_REGION   : index 1 = la 2ème colonne Excel = Région synodale
COL_REGION   = 1

# COL_DISTRICT : index 2 = la 3ème colonne Excel = Nom du district
COL_DISTRICT = 2

# COL_PAROISSE : index 3 = la 4ème colonne Excel = Nom de la paroisse
COL_PAROISSE = 3

# COL_NOM     : index 21 = la 22ème colonne Excel = Nom complet de l'ouvrier
# Cette colonne est loin des premières car les colonnes 4 à 20 contiennent
# des données agrégées de la paroisse (effectifs, statistiques globales).
COL_NOM      = 21

# COL_GRADE   : index 22 = la 23ème colonne Excel = Grade de l'ouvrier (texte libre)
COL_GRADE    = 22

# COL_CONTACT : index 23 = la 24ème colonne Excel = Numéro de téléphone
COL_CONTACT  = 23


# =============================================================================
# FONCTION 1 : normaliser()
#
# PROBLÈME :
#   Les agents de saisie n'ont pas toujours utilisé la même orthographe.
#   "Évangéliste" peut être écrit "evangeliste", "Évangéliste", "evangeliste",
#   "Evangeliste"...
#   Pour comparer du texte de manière fiable, on doit uniformiser (normaliser)
#   avant de comparer.
#
# SOLUTION :
#   1. Mettre tout en minuscules : "Pasteur" → "pasteur"
#   2. Supprimer les accents : "évangéliste" → "evangeliste"
#   3. Supprimer les espaces en début et fin : "  pasteur  " → "pasteur"
# =============================================================================
def normaliser(s):
    """Minuscule + strip + supprime accents courants pour comparer sans erreur."""

    # Si la valeur est vide (None, "", 0, False...) → retourner une chaîne vide
    if not s:
        return ""

    # str(s) : convertir en texte (au cas où ce serait un nombre ou autre type)
    # .strip() : supprimer les espaces avant et après
    # .lower() : tout mettre en minuscules
    s = str(s).strip().lower()

    # Dictionnaire des remplacements : caractère accentué → sans accent
    # Exemple : "é" est remplacé par "e", "ç" par "c", etc.
    # Sans cela, "évangéliste" ≠ "evangeliste" (Python les considère différents)
    remplacements = {
        "é": "e", "è": "e", "ê": "e", "ë": "e",  # variantes de e avec accent
        "à": "a", "â": "a", "ä": "a",              # variantes de a avec accent
        "î": "i", "ï": "i",                        # variantes de i avec accent
        "ô": "o", "ö": "o",                        # variantes de o avec accent
        "ù": "u", "û": "u", "ü": "u",              # variantes de u avec accent
        "ç": "c",                                  # cédille → c
        "œ": "oe",                                 # ligature œ → oe
        "æ": "ae",                                 # ligature æ → ae
    }

    # Boucler sur chaque paire (accentué, non-accentué) et remplacer dans s
    # Exemple : s = "évangéliste" → après le loop → s = "evangeliste"
    for src, dst in remplacements.items():
        s = s.replace(src, dst)

    # Retourner la chaîne normalisée (minuscule, sans accent, sans espaces bord)
    return s


# =============================================================================
# FONCTION 2 : mapper_grade()
#
# PROBLÈME :
#   La colonne "Grade" du fichier Excel contient du texte libre non standardisé.
#   On ne peut pas faire un simple if texte == "Pasteur" car il y a trop de
#   variantes possibles.
#
# SOLUTION :
#   On normalise d'abord le texte (minuscules, sans accents), puis on cherche
#   des mots-clés caractéristiques de chaque grade.
#   L'ordre de test est crucial : du PLUS SPÉCIFIQUE au PLUS GÉNÉRAL.
#   Pourquoi ? Parce que "ppdp" contient "pp" et "p" — si on tesait "pasteur"
#   en premier, on pourrait mal classifier "pasteur proposant avec dp".
#
# PARAMÈTRES :
#   texte_brut  : la valeur brute de la cellule Excel (ex: "Pasteur/Master")
#   cache_grades: dictionnaire {nom_grade: objet_Grade} pour éviter les
#                 requêtes SQL répétées (performance)
#
# RETOUR :
#   Un objet Grade si le texte est reconnu, None sinon.
# =============================================================================
def mapper_grade(texte_brut, cache_grades):
    """
    Analyse un texte libre et retourne l'objet Grade correspondant, ou None.
    L'ordre des tests va du grade le plus spécifique au plus général.
    """

    # Si la cellule est vide → pas de grade → retourner None
    if not texte_brut:
        return None

    # Normaliser le texte pour une comparaison fiable (sans casse ni accents)
    # Exemple : "PPDP / Master" → après normaliser() → "ppdp / master"
    t = normaliser(texte_brut)

    # ─── TEST 1 : Pasteur Proposant avec Délégation Pastorale (PPDP) ───────────
    # "ppdp" est très spécifique → doit être testé EN PREMIER
    # Sinon "pp" (test 5) capturerait "ppdp" trop tôt
    if "ppdp" in t:
        # cache_grades.get() : chercher l'objet Grade par son nom exact
        # Si le grade n'existe pas en base, retourne None (pas d'erreur)
        return cache_grades.get("Pasteur Proposant avec Délégation Pastorale")

    # ─── TEST 2 : Évangéliste avec Délégation Pastorale (Ev.DP) ──────────────
    # On cherche les variantes : "ev/dp", "ev dp", "evdp", "e v dp"
    # re.search(pattern, texte) : cherche le pattern ANYWHERE dans le texte
    # r"..." : raw string (les \ ne sont pas interprétés par Python)
    # ev[/\s]?dp : "ev" suivi optionnellement de "/" ou espace, puis "dp"
    # | : OU (alternative)
    if re.search(r"ev[/\s]?dp|evdp|e\s+v\s+dp", t):
        return cache_grades.get("Évangéliste avec Délégation Pastorale")

    # ─── TEST 3 : Évangéliste (sans Délégation Pastorale) ────────────────────
    # Plusieurs sous-tests pour couvrir toutes les variantes connues :

    # 3a. "ev" seul en début de chaîne (ex: "ev", "ev.") ou "evangeliste" en début
    # ^ev\b : "ev" en début (^) suivi d'une limite de mot (\b)
    # \b : "word boundary" = espace, ponctuation, ou fin de chaîne
    if re.search(r"^ev\b|^evangeliste|angeliste", t):
        return cache_grades.get("Évangéliste")

    # 3b. "evangeliste" dans le texte, mais PAS "dp" (sinon c'est Ev.DP)
    if "evangeliste" in t and "dp" not in t:
        return cache_grades.get("Évangéliste")

    # 3c. Variantes avec responsabilité : "ev/responsable", "ev/vice-responsable"
    if re.search(r"ev/responsable|ev\s*/\s*vice", t):
        return cache_grades.get("Évangéliste")

    # 3d. "ev" exactement, ou commence par "ev " ou "ev/"
    if t in ("ev", "evdp") or t.startswith("ev ") or t.startswith("ev/"):
        return cache_grades.get("Évangéliste")

    # ─── TEST 4 : Pasteur ─────────────────────────────────────────────────────
    # "Pasteur" est un grade très courant avec beaucoup de variantes :
    # - "Pasteur", "Pasteure" (féminin)
    # - "Rév." ou "Rev." (abréviation de Révérend, titre honorifique des pasteurs)
    # - "Revd" (Reverend Doctor)
    # - "PR" ou "Pr" (Pasteur Responsable)
    # - "P" seul (rare, mais présent dans certaines cellules)

    # ^pasteur : commence par "pasteur"
    # ^rev\b : commence par "rev" (word boundary pour éviter "revanche")
    # ^pr\b : commence par "pr" + limite de mot
    # ^p\b$ : est EXACTEMENT "p" (rien d'autre)
    if re.search(r"^pasteur|^rev\b|^revd|^reve|^pr\b|^p\b$", t):
        return cache_grades.get("Pasteur")

    # 4b. "pasteur" anywhere dans le texte (ex: "maitre pasteur", "pasteur/docteur")
    if "pasteur" in t:
        return cache_grades.get("Pasteur")

    # ─── TEST 5 : Pasteur Proposant ───────────────────────────────────────────
    # Un "Proposant" est un futur pasteur en formation, pas encore consacré.
    # Variantes : "PP", "P.P.", "pasteur proposant", "pasteur stagiaire"
    # Testé APRÈS pasteur pour éviter que "pasteur" capture "pasteur proposant"
    if re.search(r"^pp\b|^p\.p\b|pasteur\s+proposant|pasteur\s+stagiaire", t):
        return cache_grades.get("Pasteur Proposant")

    # ─── TEST 6 : Délégué Pastoral ────────────────────────────────────────────
    # Variantes : "DP", "D.P.", "Délégué Pastoral", "delegue pastoral"
    if re.search(r"^dp\b|^d\.p\b|delegue\s+pastoral", t):
        return cache_grades.get("Délégué Pastoral")

    # 6b. "dp" seul, ou "dp/ev", ou commence par "dp " ou "dp/"
    if t in ("dp", "dp/ev", "dp /pp") or t.startswith("dp ") or t.startswith("dp/"):
        return cache_grades.get("Délégué Pastoral")

    # ─── TEST 7 : Aide-Évangéliste ────────────────────────────────────────────
    # Le grade le plus bas de la hiérarchie. On cherche les deux mots-clés
    # "aide" ET "ev" dans la même cellule (pas forcément adjacents).
    if "aide" in t and "ev" in t:
        return cache_grades.get("Aide-Évangéliste")

    # ─── AUCUN GRADE RECONNU ──────────────────────────────────────────────────
    # Le texte ne correspond à aucun grade connu.
    # On retourne None : l'ouvrier sera importé sans grade (grade=None).
    # La view API accepte grade=None (allow_null=True dans le serializer).
    return None


# =============================================================================
# FONCTION 3 : nettoyer_nom()
#
# PROBLÈME :
#   Certaines cellules Excel contiennent des préfixes de liste numérotée :
#   "1- BATCHAYA Anie" → le nom réel est "BATCHAYA Anie", pas "1-"
#   "- MVONDO Paul"   → le nom réel est "MVONDO Paul", pas "-"
#   "2) ESSAMA Jean"  → le nom réel est "ESSAMA Jean", pas "2)"
#   Ces préfixes viennent probablement d'un copier-coller depuis Word ou PDF.
#
# SOLUTION :
#   Utiliser des expressions régulières pour supprimer ces préfixes.
# =============================================================================
def nettoyer_nom(nom_complet):
    """
    Supprime les préfixes parasites (1-, 2-, -, –, 1), 2)) en début de chaîne.
    Exemples :
      "1- TAKAM Roger" → "TAKAM Roger"
      "- MVONDO Paul"  → "MVONDO Paul"
      "2) ESSAMA Jean" → "ESSAMA Jean"
    """

    # Convertir en texte et supprimer les espaces avant/après
    nom_complet = str(nom_complet).strip()

    # Regex 1 : supprime les préfixes numériques "1-", "2-", "1)", "2)", etc.
    # ^\d+   : un ou plusieurs chiffres en début de chaîne
    # [\-\)] : suivi d'un tiret ou d'une parenthèse fermante
    # \s*    : suivi d'espaces éventuels
    # On remplace tout ça par "" (chaîne vide = suppression)
    nom_complet = re.sub(r"^\d+[\-\)]\s*", "", nom_complet)

    # Regex 2 : supprime les préfixes "- " ou "– " (tiret simple ou tiret long)
    # ^    : en début de chaîne
    # [\-–]: tiret court (-) OU tiret long (–)
    # \s*  : suivi d'espaces éventuels
    nom_complet = re.sub(r"^[\-–]\s*", "", nom_complet)

    # Supprimer les espaces résiduels qui auraient pu rester
    return nom_complet.strip()


# =============================================================================
# FONCTION 4 : split_nom_prenom()
#
# PROBLÈME :
#   Les noms dans le fichier Excel sont en format "NOM Prénom(s)" sur une seule
#   ligne (ex: "TAKAM Roger Ernest", "MVONDO Paul", "BATCHAYA Anie Claire").
#   Le modèle Django a deux champs séparés : nom et prenom.
#   Il faut donc découper la chaîne en deux parties.
#
# CONVENTION CAMEROUNAISE :
#   Au Cameroun, la convention courante est de mettre le nom de famille
#   EN MAJUSCULES en premier, suivi du ou des prénoms.
#   C'est pourquoi on découpe sur le PREMIER espace :
#   "TAKAM Roger Ernest" → nom="TAKAM", prenom="Roger Ernest"
#   Cette convention n'est pas parfaite (certains noms ont plusieurs mots),
#   mais c'est la meilleure approximation avec les données disponibles.
# =============================================================================
def split_nom_prenom(nom_complet):
    """
    Découpe 'NOM Prénom Autres' en (nom, prenom).
    Le premier mot devient le nom de famille, le reste devient les prénoms.
    """

    # Nettoyer d'abord les préfixes parasites (appel à la fonction ci-dessus)
    nom_complet = nettoyer_nom(nom_complet)

    # Si après nettoyage la chaîne est vide → retourner deux chaînes vides
    if not nom_complet:
        return "", ""

    # split(None, 1) : découper sur n'importe quel espace, mais SEULEMENT 1 fois
    # None comme séparateur = "tout espace blanc" (espaces, tabs)
    # 1 comme maxsplit = faire au plus 1 découpe
    # Exemple :
    #   "TAKAM Roger Ernest".split(None, 1) → ["TAKAM", "Roger Ernest"]
    #   "MVONDO".split(None, 1)             → ["MVONDO"]  (pas de prénom)
    parties = nom_complet.split(None, 1)

    # Si le split ne donne qu'un seul élément → pas d'espace dans la chaîne
    # → tout le texte est le nom de famille, prenom = ""
    if len(parties) == 1:
        # [:100] : limite à 100 caractères (max_length du champ dans le modèle)
        return parties[0][:100], ""

    # Cas normal : nom = premier mot, prenom = tout le reste
    # [:100] sur les deux pour respecter les contraintes du modèle
    return parties[0][:100], parties[1][:100]


# =============================================================================
# CLASSE PRINCIPALE : Command
#
# C'est la classe que Django exécute quand on lance :
#   python manage.py import_ouvriers
#
# Toute commande de gestion Django doit :
#   1. Hériter de BaseCommand
#   2. Définir self.help (description de la commande)
#   3. Implémenter handle() (la logique principale)
#   4. Optionnellement : add_arguments() pour les options en ligne de commande
# =============================================================================
class Command(BaseCommand):
    """
    Commande Django qui importe les ouvriers depuis le fichier Excel.

    Elle orchestre toutes les fonctions définies ci-dessus et interagit
    avec la base de données PostgreSQL via les modèles Django.
    """

    # Message affiché quand on fait : python manage.py import_ouvriers --help
    help = "Importe les 708 ouvriers depuis OUVRIERS.xlsx"

    # ─────────────────────────────────────────────────────────────────────────
    # MÉTHODE : add_arguments()
    # Déclare les options acceptées en ligne de commande.
    # Django appelle cette méthode automatiquement avant handle().
    # ─────────────────────────────────────────────────────────────────────────
    def add_arguments(self, parser):
        """
        Déclare les options optionnelles de la commande.
        'parser' est fourni par Django (argparse.ArgumentParser).
        """

        # Option --dry-run : simule l'import sans écrire en base
        # action="store_true" : si l'option est présente, options["dry_run"] = True
        # Sinon options["dry_run"] = False
        # Exemple d'usage : python manage.py import_ouvriers --dry-run
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule sans écrire en base — affiche ce qui serait créé"
        )

        # Option --data-dir : chemin vers le dossier contenant OUVRIERS.xlsx
        # default="/data" : valeur par défaut quand l'option n'est pas spécifiée
        # En production Docker, /data est monté comme volume depuis d:\Academique\GEOEEC\data\
        # Exemple : python manage.py import_ouvriers --data-dir /autre/chemin
        parser.add_argument(
            "--data-dir",
            default="/data",
            help="Chemin vers le dossier data (défaut : /data)"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # MÉTHODE : handle()
    # C'est ici que toute la logique d'import se passe.
    # Django appelle handle() automatiquement quand on exécute la commande.
    # ─────────────────────────────────────────────────────────────────────────
    def handle(self, *args, **options):
        """
        Point d'entrée principal de la commande.
        *args     : arguments positionnels (non utilisés ici)
        **options : dictionnaire avec les options déclarées dans add_arguments()
        """

        # Récupérer les options fournies en ligne de commande
        # options["dry_run"] : True si --dry-run a été passé, False sinon
        dry_run  = options["dry_run"]
        # options["data_dir"] : chemin fourni par --data-dir, ou "/data" par défaut
        data_dir = options["data_dir"]

        # Informer l'utilisateur qu'on est en mode simulation
        if dry_run:
            # self.style.WARNING() : colore le texte en JAUNE dans le terminal
            self.stdout.write(self.style.WARNING("MODE SIMULATION — rien ne sera écrit en base"))

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 1 : Vérifier que les grades existent en base
        # ═══════════════════════════════════════════════════════════════════
        # Si aucun grade n'existe, les ouvriers ne peuvent pas être associés.
        # Il faut d'abord lancer : python manage.py import_grades
        nb_grades = Grade.objects.count()  # COUNT(*) FROM ouvriers_grade

        if nb_grades == 0:
            # self.stderr : canal d'erreur (≠ stdout qui est le canal normal)
            # self.style.ERROR() : colore en rouge dans le terminal
            self.stderr.write(self.style.ERROR(
                "ERREUR : Aucun grade en base.\n"
                "Lancez d'abord : python manage.py import_grades"
            ))
            # Arrêter l'exécution ici (return dans handle = fin de la commande)
            return

        # Charger TOUS les grades en mémoire dans un dictionnaire :
        # { "Pasteur": <Grade objet>, "Évangéliste": <Grade objet>, ... }
        # C'est un "cache" : on évite ainsi de faire une requête SQL à chaque
        # ouvrier pour chercher le grade. Au lieu de 685 requêtes → 1 seule.
        cache_grades = {g.nom: g for g in Grade.objects.all()}
        self.stdout.write(f"Grades chargés en mémoire : {len(cache_grades)}")

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 2 : Trouver le fichier OUVRIERS.xlsx
        # ═══════════════════════════════════════════════════════════════════
        # os.listdir() : retourne la liste des noms de fichiers dans data_dir
        fichiers = os.listdir(data_dir)

        # next() : trouver le PREMIER fichier dont le nom contient "ouvrier"
        # (insensible à la casse grâce à .lower())
        # Si aucun fichier trouvé → next() retourne None (le deuxième argument)
        nom_fichier = next(
            (f for f in fichiers if "ouvrier" in f.lower()),
            None  # valeur retournée si aucun fichier ne correspond
        )

        # Si aucun fichier correspondant n'a été trouvé → erreur et arrêt
        if not nom_fichier:
            self.stderr.write(self.style.ERROR(
                "ERREUR : Fichier OUVRIERS.xlsx introuvable dans " + data_dir + "\n"
                "Vérifiez que le volume Docker est bien monté avec :\n"
                "  -v 'd:/Academique/GEOEEC/data:/data'"
            ))
            return

        # Construire le chemin complet vers le fichier
        # os.path.join() : assemble le chemin correctement selon l'OS
        # Exemple : os.path.join("/data", "OUVRIERS.xlsx") → "/data/OUVRIERS.xlsx"
        chemin = os.path.join(data_dir, nom_fichier)
        self.stdout.write(f"Fichier trouvé : {nom_fichier}")

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 3 : Lire le fichier Excel
        # ═══════════════════════════════════════════════════════════════════
        # openpyxl.load_workbook() : ouvre le fichier Excel
        # read_only=True : ne pas charger les formules (plus rapide)
        # data_only=True : récupérer les VALEURS calculées, pas les formules
        wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)

        # ws["Sheet1"] : accéder à la feuille nommée "Sheet1"
        # C'est la première feuille du classeur Excel
        ws = wb["Sheet1"]

        # iter_rows(values_only=True) : lire toutes les lignes
        # values_only=True : retourner des tuples de valeurs Python (pas d'objets Cell)
        # list() : convertir le générateur en liste pour pouvoir l'utiliser plusieurs fois
        rows = list(ws.iter_rows(values_only=True))

        # La première ligne est l'en-tête (noms des colonnes) → la sauter
        # rows[0] = ["Niveau", "Region_synodale", "districts", ...]
        # rows[1:] = toutes les lignes de données (index 1 à la fin)
        data = rows[1:]
        self.stdout.write(f"Sheet1 : {len(data)} lignes brutes (dont certaines vides)")

        # Fermer le fichier Excel pour libérer la mémoire
        # Bonne pratique : toujours fermer les fichiers après lecture
        wb.close()

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 4 : Charger le cache des paroisses
        # ═══════════════════════════════════════════════════════════════════
        # On crée un dictionnaire : (NOM_DISTRICT, NOM_PAROISSE) → Paroisse
        # Pourquoi ? Pour retrouver rapidement la paroisse de chaque ouvrier
        # sans faire une requête SQL pour chaque ligne Excel.
        #
        # Exemple du contenu :
        # {
        #   ("ADAMAOUA", "NGAOUNDERE CENTRE") : <Paroisse id=42>,
        #   ("SUD", "BIKOP")                  : <Paroisse id=7>,
        #   ...
        # }
        #
        # .select_related("district") : charge le district de chaque paroisse
        # en une seule requête SQL (JOIN). Sans ça, Django ferait une requête
        # séparée pour chaque paroisse pour charger son district.
        #
        # .upper() : mettre en majuscules pour la comparaison insensible à la casse
        paroisses_db = {
            (p.district.nom.upper(), p.nom.upper()): p
            for p in Paroisse.objects.select_related("district").all()
        }
        self.stdout.write(f"Paroisses chargées en mémoire : {len(paroisses_db)}")
        self.stdout.write("")  # ligne vide pour la lisibilité

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 5 : Compteurs pour le bilan final
        # ═══════════════════════════════════════════════════════════════════
        nb_crees        = 0  # Ouvriers nouvellement créés en base
        nb_maj          = 0  # Ouvriers déjà existants, mis à jour
        nb_ignores      = 0  # Lignes sans nom d'ouvrier (ignorées)
        nb_introuvables = 0  # Ouvriers dont la paroisse n'est pas en base
        nb_grade_inconnu = 0 # Ouvriers importés sans grade reconnu

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 6 : Parcourir chaque ligne du fichier Excel
        # ═══════════════════════════════════════════════════════════════════
        # enumerate(data, start=2) : itérer avec un compteur i qui commence à 2
        # start=2 car la ligne 1 est l'en-tête (déjà sautée), les données
        # commencent à la ligne 2 du fichier Excel → utile pour les messages d'erreur
        for i, row in enumerate(data, start=2):

            # ─── 6a. Lire le nom de l'ouvrier (colonne obligatoire) ───────────
            # row[COL_NOM] : accéder à la 22ème colonne de cette ligne (index 21)
            # "if len(row) > COL_NOM" : vérifier que la ligne a assez de colonnes
            # (certaines lignes Excel peuvent être incomplètes)
            nom_brut = row[COL_NOM] if len(row) > COL_NOM else None

            # Si la cellule nom est vide → ligne sans ouvrier, ignorer
            if not nom_brut or str(nom_brut).strip() == "":
                nb_ignores += 1  # Compter pour le bilan
                continue  # Passer à la ligne suivante sans rien faire

            # Nettoyer et découper le nom complet en (nom, prénom)
            nom_complet = str(nom_brut).strip()
            nom, prenom = split_nom_prenom(nom_complet)

            # ─── 6b. Retrouver la paroisse de l'ouvrier ──────────────────────
            # Lire les noms du district et de la paroisse dans Excel
            district_brut = row[COL_DISTRICT] if len(row) > COL_DISTRICT else None
            paroisse_brut = row[COL_PAROISSE] if len(row) > COL_PAROISSE else None

            # Normaliser en majuscules pour la recherche dans le cache
            # str(...).strip().upper() : convertir, nettoyer, mettre en majuscules
            # "if paroisse_brut else ''" : si None → chaîne vide (pas d'erreur)
            nom_par_clean  = str(paroisse_brut).strip().upper() if paroisse_brut else ""
            nom_dist_clean = str(district_brut).strip().upper() if district_brut else ""

            # TENTATIVE 1 : chercher par la combinaison (district, paroisse)
            # Exemple : ("NGAOUNDERE", "BIKOP") → <Paroisse objet>
            paroisse_obj = paroisses_db.get((nom_dist_clean, nom_par_clean))

            # TENTATIVE 2 : si la combinaison échoue (ex: faute d'orthographe
            # dans le nom du district), chercher uniquement par le nom de paroisse
            if not paroisse_obj and nom_par_clean:
                # Chercher toutes les paroisses avec ce nom exact (peu importe le district)
                # Si on en trouve EXACTEMENT 1 → c'est forcément la bonne
                # Si on en trouve 0 ou plusieurs → on ne peut pas décider → on laisse None
                matches = [p for (d, n), p in paroisses_db.items() if n == nom_par_clean]
                if len(matches) == 1:
                    paroisse_obj = matches[0]

            # Si aucune paroisse n'a été trouvée → impossible d'importer cet ouvrier
            # (un ouvrier doit appartenir à une paroisse, c'est une FK NOT NULL)
            if not paroisse_obj:
                nb_introuvables += 1  # Compter pour le bilan
                continue  # Passer à la ligne suivante

            # ─── 6c. Mapper le grade ─────────────────────────────────────────
            # Lire la valeur brute du grade dans la cellule Excel
            grade_brut = row[COL_GRADE] if len(row) > COL_GRADE else None

            # Appeler mapper_grade() pour obtenir l'objet Grade correspondant
            # Si le texte ne correspond à aucun grade → grade_obj = None
            grade_obj = mapper_grade(grade_brut, cache_grades)

            # Si la cellule n'était pas vide MAIS qu'aucun grade n'a été reconnu
            # → c'est un grade non standardisé (ex: "Licencié en théologie")
            if grade_brut and grade_obj is None:
                nb_grade_inconnu += 1  # Compter, mais l'ouvrier sera quand même importé

            # ─── 6d. Lire le contact téléphonique ────────────────────────────
            # Lire et nettoyer le numéro de téléphone
            # str(row[COL_CONTACT]) : convertir en texte (peut être un nombre en Excel)
            # [:30] : limiter à 30 caractères (max_length du champ dans le modèle)
            contact = ""
            if len(row) > COL_CONTACT and row[COL_CONTACT]:
                contact = str(row[COL_CONTACT]).strip()[:30]

            # ─── 6e. Mode simulation ─────────────────────────────────────────
            # Si --dry-run est actif → afficher ce qui SERAIT créé, ne pas écrire
            if dry_run:
                # Abréviation du grade pour l'affichage (ou "???" si inconnu)
                grade_str = grade_obj.abreviation if grade_obj else "???"
                # :25s = aligner sur 25 caractères (pour un affichage lisible en colonnes)
                self.stdout.write(
                    f"  [SIM] {nom[:25]:25s} {prenom[:25]:25s} | "
                    f"{grade_str:10s} | {paroisse_obj.nom[:30]:30s}"
                )
                nb_crees += 1  # Compter comme "créé" pour le bilan de simulation
                continue  # Ne pas aller jusqu'à update_or_create()

            # ─── 6f. Créer ou mettre à jour l'ouvrier en base de données ─────
            # update_or_create() : méthode Django qui fait deux choses en une :
            #   - Cherche un Ouvrier avec (paroisse=paroisse_obj, nom=nom)
            #   - S'il EXISTE → le mettre à jour avec les valeurs de "defaults"
            #   - S'il N'EXISTE PAS → en créer un nouveau avec la clé + defaults
            #
            # La clé de recherche (paroisse + nom) garantit qu'on n'importe pas
            # deux fois le même ouvrier de la même paroisse.
            #
            # Retourne un tuple : (objet_ouvrier, a_ete_cree)
            # _ : on n'a pas besoin de l'objet ouvrier lui-même ici
            # created : True si créé, False si mis à jour
            _, created = Ouvrier.objects.update_or_create(
                paroisse=paroisse_obj,  # FK vers la paroisse (clé de recherche)
                nom=nom,                # Nom de famille (clé de recherche)
                defaults={
                    "prenom":    prenom,      # Prénom(s) — mis à jour si l'ouvrier existe
                    "grade":     grade_obj,   # Objet Grade (peut être None)
                    "telephone": contact,     # Numéro de téléphone
                    "statut":    "ACTIF",     # Valeur par défaut : tous actifs à l'import
                }
            )

            # Incrémenter le bon compteur selon si créé ou mis à jour
            if created:
                nb_crees += 1
            else:
                nb_maj += 1

        # ═══════════════════════════════════════════════════════════════════
        # ÉTAPE 7 : Afficher le bilan final
        # ═══════════════════════════════════════════════════════════════════
        self.stdout.write("")  # Ligne vide pour séparer du reste des logs
        self.stdout.write("=" * 60)  # Ligne décorative de séparation

        # self.style.SUCCESS() : colore le texte en VERT dans le terminal
        # f"..." multi-lignes : le \n crée un retour à la ligne dans le message
        self.stdout.write(self.style.SUCCESS(
            f"IMPORT OUVRIERS TERMINÉ\n"
            f"  Créés                       : {nb_crees}\n"
            f"  Mis à jour (existaient déjà): {nb_maj}\n"
            f"  Ignorés (cellule nom vide)  : {nb_ignores}\n"
            f"  Paroisse absente en base    : {nb_introuvables}\n"
            f"  Grade non reconnu           : {nb_grade_inconnu} (importés sans grade)"
        ))
        self.stdout.write("=" * 60)
