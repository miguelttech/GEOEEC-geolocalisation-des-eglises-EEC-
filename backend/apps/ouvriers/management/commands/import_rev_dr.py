"""
=============================================================================
FICHIER : apps/ouvriers/management/commands/import_rev_dr.py
RÔLE    : Attribuer le grade « Rév Dr » aux ouvriers listés dans le document

SOURCE
------
« Rev_Dr_fusionne.docx » — 29 lignes (N° 1109 à 1137), colonnes
N° / Nom et Prénom / Grade, ce dernier valant « Rév Dr » partout.

POURQUOI UN APPARIEMENT PAR LE NOM
----------------------------------
Contrairement à import_grades_docx.py, ce document ne porte PAS l'identifiant
des ouvriers : ses N° 1109-1137 sont une numérotation propre au document (la
base ne compte que 643 ouvriers). Le rapprochement se fait donc sur le nom, ce
qui est intrinsèquement moins sûr — d'où les garde-fous ci-dessous.

DIFFICULTÉ : DES LIBELLÉS DE BASE POLLUÉS
-----------------------------------------
Les champs nom/prenom viennent d'un Excel saisi à la main et charrient des
mentions parasites : titres (« Docteur TCHIO ANDRE »), diplômes
(« baccalauréat en theologie … »), marqueurs de saisie (« … DOCTEUR TEL »), et
parfois PLUSIEURS PERSONNES dans une seule fiche (« MBOUTE Madeleine
ELLONG MBELLA »). Comparer les libellés bruts ne rapprocherait presque rien.

MÉTHODE, EN TROIS TEMPS
-----------------------
1. Les deux libellés sont réduits à un ENSEMBLE de jetons : accents et
   ponctuation retirés, casse ignorée, et les mots de bruit (BRUIT) écartés.
   L'ensemble rend l'ordre indifférent — la base écrit « SEZONO SEZINE
   SAMUEL » là où le document écrit « Sezine Sezono Samuel ».

2. Un ouvrier est candidat si les jetons du document sont TOUS présents chez
   lui. L'appariement n'est retenu que s'il y a exactement un candidat.

3. GARDE-FOU : si ce candidat porte en plus des jetons de nom que le document
   ignore, la fiche mêle probablement plusieurs personnes — le grade pourrait
   être attribué à la mauvaise. L'écriture est alors refusée, SAUF si la ligne
   figure dans APPARIEMENTS, où un opérateur a vérifié la fiche et consigné le
   libellé exact attendu. Tout écart ultérieur de ce libellé rouvre le refus.

CE QUI N'EST PAS FAIT
---------------------
Aucun ouvrier n'est créé : les noms sans correspondance sont seulement
listés, pour arbitrage par la maîtrise d'ouvrage. Aucun patronyme n'est
réécrit non plus — nettoyer les libellés pollués est un autre chantier.

Pour rendre cet arbitrage praticable, chaque nom sans correspondance est
accompagné des fiches les plus ressemblantes, jetons comparés un à un en
tolérant les fautes de frappe (« Kalonji » / « Kalondji »). Ces pistes ne
sont QU'INDICATIVES : elles ne déclenchent aucune écriture, l'appariement
approché étant trop faillible pour attribuer un grade sans relecture.

LE GRADE EXISTANT EST REMPLACÉ
------------------------------
« Rév Dr » est un grade à part entière (décision de la maîtrise d'ouvrage) et
`Ouvrier.grade` est unique : les ouvriers appariés perdent leur grade
précédent, presque toujours « P. » ou « Ev. ». Chaque remplacement est tracé
ligne à ligne dans le compte rendu — le relire avant de valider un --execute.

USAGE
-----
    python manage.py import_rev_dr --dry-run
    python manage.py import_rev_dr --execute
=============================================================================
"""

import difflib
import unicodedata

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.geo.docx import DocxIllisible, lire_tableau, normaliser
from apps.ouvriers.models import Grade, Ouvrier

FICHIER_DEFAUT = "/data/Rev_Dr_fusionne.docx"

COL_NUM, COL_NOM, COL_GRADE = 0, 1, 2

# Grade attribué par cette commande, créé par la migration 0006_grade_rev_dr.
ABREVIATION = "Rév Dr"

# Mots présents dans les libellés mais qui ne font pas partie du nom : titres,
# diplômes, grades, marqueurs de saisie. Les écarter des deux côtés est ce qui
# permet de rapprocher « Docteur TCHIO ANDRE » de « TCHIO André ».
BRUIT = {
    # titres et diplômes
    "dr", "docteur", "doctorat", "rvd", "rev", "reverend", "reverant", "r",
    "baccalaureat", "licence", "licencier", "theologie", "en",
    # grades, souvent recopiés dans le champ nom
    "pasteur", "proposant", "proposante", "pp", "ppdp", "ev", "evdp",
    "evangeliste", "angeliste", "aide", "delegue", "deleguee", "delegation",
    "pastoral", "pastorale", "responsable", "paroisse", "de",
    # marqueurs de saisie et civilités
    "tel", "telephone", "mr", "mme", "epse", "ep", "epouse", "nee", "ne",
}

# Lignes volontairement écartées : N° du document -> motif.
ECARTEES = {
    1109: "le seul candidat, #593, réunit trois personnes dans son libellé "
          "(« Tadjo Séraphin … Takoukam Martial … BIEDA MFASSU EDOUARD ») et "
          "« BIEDA MFASSU » n'y figure pas en tête : rien ne dit que la fiche "
          "désigne bien cet ouvrier",
}

# Appariements vérifiés à la main, qui lèvent le garde-fou de l'étape 3 :
#   N° du document -> (libellé exact en base, motif de la vérification)
# Le libellé est réexigé à chaque exécution : si la base est corrigée ailleurs,
# l'appariement redevient un refus plutôt que de porter sur un autre ouvrier.
APPARIEMENTS = {
    1117: ("KENGNE KAMGA Lilienne Epse Bongongui",
           "« Bongongui » est le nom d'épouse, pas une seconde personne"),
    1119: ("R Dr KUATE DJILO Clément Hervé - R Bekima Paul Armel -  Njimla Clovis Ottis",
           "fiche à trois personnes, mais « R Dr KUATE DJILO » ouvre le libellé "
           "et porte déjà la mention Rév Dr"),
    1120: ("MBOUTE Madeleine    ELLONG MBELLA",
           "fiche à deux personnes ; « MBOUTE Madeleine » ouvre le libellé "
           "(« ELLONG MBELLA » est le N° 1111, resté sans fiche propre)"),
    1122: ("Ndabo Eyango jules docteur   EMADE JEANINE",
           "fiche à deux personnes ; « Ndabo Eyango Jules » ouvre le libellé "
           "et porte la mention « docteur »"),
    1125: ("R Dr NGAMBEKET Ebenezer   PP  FOUNSIE Samuel Elvis",
           "fiche à deux personnes ; « R Dr NGAMBEKET Ebenezer » ouvre le "
           "libellé et porte déjà la mention Rév Dr"),
    1131: ("Dr Nyamsi Ngomsi Etienne Aimée",
           "« Aimée » est un second prénom absent du document, pas une autre "
           "personne ; la mention « Dr » confirme l'identité"),
    1134: ("baccalauréat en theologie   Tayo Nji Jacques Hippolyte tel",
           "« Hippolyte » en base contre « Hyppolite » au document : simple "
           "variante orthographique du même prénom"),
}


# Seuils de la recherche de pistes (purement indicative, aucune écriture).
# RESSEMBLANCE_JETON : deux jetons sont « le même mot » au-dessus de ce ratio,
#   ce qui absorbe une lettre en trop ou une consonne doublée.
# RESSEMBLANCE_MINI  : part des jetons du document à retrouver pour être une
#   piste. 0,6 laisse passer deux mots sur trois — assez lâche pour proposer,
#   assez strict pour ne pas noyer le compte rendu.
RESSEMBLANCE_JETON = 0.85
RESSEMBLANCE_MINI = 0.6
PISTES_MAX = 3


def jetons(libelle):
    """Réduit un libellé à l'ensemble de ses jetons de nom.

    Accents et ponctuation retirés, casse ignorée, mots de BRUIT écartés.
    L'ensemble (et non la liste) rend l'ordre des mots indifférent.
    """
    plat = unicodedata.normalize("NFD", libelle or "").encode("ascii", "ignore").decode()
    for signe in "-'’.,;:/()":
        plat = plat.replace(signe, " ")
    return {m for m in plat.lower().split() if m not in BRUIT and not m.isdigit()}


def ressemblance(cible, candidat):
    """Part des jetons de `cible` retrouvés dans `candidat`, fautes tolérées.

    Chaque jeton du document est apparié à un jeton de la fiche, et celui-ci
    est retiré du lot : deux jetons du document ne peuvent pas se rabattre sur
    le même mot de la fiche et gonfler le score.
    """
    if not cible:
        return 0.0
    restants = list(candidat)
    trouves = 0
    for jeton in cible:
        proche = difflib.get_close_matches(jeton, restants, n=1, cutoff=RESSEMBLANCE_JETON)
        if proche:
            trouves += 1
            restants.remove(proche[0])
    return trouves / len(cible)


class Command(BaseCommand):
    help = "Attribue le grade « Rév Dr » aux ouvriers listés dans Rev_Dr_fusionne.docx."

    def add_arguments(self, parser):
        parser.add_argument("--fichier", default=FICHIER_DEFAUT)
        parser.add_argument("--execute", action="store_true",
                            help="Applique l'import. Sans ce drapeau, rien n'est ecrit.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation explicite (comportement par defaut).")

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]

        grade = Grade.objects.filter(abreviation=ABREVIATION).first()
        if grade is None:
            raise CommandError(
                f"Le grade {ABREVIATION!r} est absent de la table Grade. "
                "Appliquer la migration 0006_grade_rev_dr, ou rejouer import_grades.")

        try:
            lignes = lire_tableau(opts["fichier"], colonnes_min=3)
        except DocxIllisible as exc:
            raise CommandError(str(exc))
        lignes = [l for l in lignes if l[COL_NUM].strip().isdigit()]

        # Index des ouvriers, calculé une fois : la base en compte plusieurs
        # centaines et chaque ligne du document les parcourt toutes.
        ouvriers = [(o, jetons(f"{o.nom} {o.prenom}"))
                    for o in Ouvrier.objects.select_related("grade").all()]
        par_libelle = {}
        for o, _ in ouvriers:
            par_libelle.setdefault(normaliser(f"{o.nom} {o.prenom}"), []).append(o)

        # Grade de départ, relevé AVANT toute écriture : les objets de l'index
        # sont modifiés en cours de route, et une piste afficherait sinon
        # « Rév Dr » pour un ouvrier que la simulation vient d'annuler.
        grade_initial = {o.pk: (o.grade.abreviation if o.grade_id else "sans grade")
                         for o, _ in ouvriers}

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{'IMPORT REEL' if execute else 'SIMULATION (aucune ecriture)'} — "
            f"{len(lignes)} ligne(s) lues dans {opts['fichier']}"))

        ecrits, inchanges, arbitrer, introuvables, ecartees = [], [], [], [], []

        with transaction.atomic():
            for ligne in lignes:
                num = int(ligne[COL_NUM].strip())
                libelle_doc = ligne[COL_NOM].strip()

                if num in ECARTEES:
                    ecartees.append((num, libelle_doc, ECARTEES[num]))
                    continue

                ouvrier, motif = self._apparier(
                    num, libelle_doc, ouvriers, par_libelle, arbitrer, introuvables)
                if ouvrier is None:
                    continue

                ancien = ouvrier.grade.abreviation if ouvrier.grade_id else "sans grade"
                if ouvrier.grade_id == grade.pk:
                    inchanges.append((num, libelle_doc, ouvrier))
                    continue

                ouvrier.grade = grade
                ouvrier.save(update_fields=["grade", "updated_at"])
                ecrits.append((num, libelle_doc, ouvrier, ancien, motif))

            if not execute:
                transaction.set_rollback(True)

        self._resumer(ecrits, inchanges, arbitrer, introuvables, ecartees,
                      lignes, ouvriers, grade_initial, execute)

    def _apparier(self, num, libelle_doc, ouvriers, par_libelle, arbitrer, introuvables):
        """Retourne (ouvrier, motif) ou (None, None), en consignant les refus."""
        # Appariement vérifié à la main : recherche directe sur le libellé exact.
        if num in APPARIEMENTS:
            attendu, motif = APPARIEMENTS[num]
            candidats = par_libelle.get(normaliser(attendu), [])
            if len(candidats) == 1:
                return candidats[0], f"apparie a la main — {motif}"
            arbitrer.append((
                num, libelle_doc,
                f"appariement verifie caduc : {len(candidats)} ouvrier(s) portent "
                f"le libelle attendu \"{attendu}\" (la base a change ?)"))
            return None, None

        cible = jetons(libelle_doc)
        if len(cible) < 2:
            arbitrer.append((num, libelle_doc, "libelle trop court pour etre apparie sans risque"))
            return None, None

        candidats = [(o, j) for o, j in ouvriers if cible <= j]
        if not candidats:
            introuvables.append((num, libelle_doc, cible))
            return None, None
        if len(candidats) > 1:
            arbitrer.append((
                num, libelle_doc,
                "plusieurs ouvriers correspondent : "
                + " | ".join(f"#{o.pk} \"{o.nom} {o.prenom}\"" for o, _ in candidats)))
            return None, None

        ouvrier, jetons_base = candidats[0]
        surplus = jetons_base - cible
        if surplus:
            # Garde-fou : la fiche porte d'autres noms que ceux du document.
            arbitrer.append((
                num, libelle_doc,
                f"#{ouvrier.pk} \"{ouvrier.nom} {ouvrier.prenom}\" porte en plus "
                f"{sorted(surplus)} — fiche possiblement partagee, a verifier puis "
                f"a inscrire dans APPARIEMENTS"))
            return None, None
        return ouvrier, "libelles equivalents"

    def _resumer(self, ecrits, inchanges, arbitrer, introuvables, ecartees,
                 lignes, ouvriers, grade_initial, execute):
        self.stdout.write(self.style.MIGRATE_HEADING("\nGRADES ATTRIBUES"))
        for num, libelle, o, ancien, motif in ecrits:
            self.stdout.write(
                f"  {num}  \"{libelle}\"\n"
                f"        -> #{o.pk} \"{o.nom} {o.prenom}\"  {ancien} -> {ABREVIATION}\n"
                f"           {motif}")
        if not ecrits:
            self.stdout.write("  (aucun)")

        if inchanges:
            self.stdout.write(self.style.MIGRATE_HEADING(
                f"\nDEJA AU GRADE {ABREVIATION} ({len(inchanges)})"))
            for num, libelle, o in inchanges:
                self.stdout.write(f"  {num}  #{o.pk} \"{o.nom} {o.prenom}\"")

        if arbitrer:
            self.stdout.write(self.style.MIGRATE_HEADING(
                f"\nA ARBITRER — non ecrits ({len(arbitrer)})"))
            for num, libelle, motif in arbitrer:
                self.stdout.write(self.style.WARNING(f"  {num}  \"{libelle}\"\n        {motif}"))

        if ecartees:
            self.stdout.write(self.style.MIGRATE_HEADING(
                f"\nECARTEES VOLONTAIREMENT ({len(ecartees)})"))
            for num, libelle, motif in ecartees:
                self.stdout.write(self.style.WARNING(f"  {num}  \"{libelle}\"\n        {motif}"))

        if introuvables:
            self.stdout.write(self.style.MIGRATE_HEADING(
                f"\nAUCUN OUVRIER DE CE NOM EN BASE ({len(introuvables)})"))
            self.stdout.write(
                "  Les fiches proposees ne sont que des PISTES a verifier :\n"
                "  aucune n'a ete ecrite, et le rapprochement y tolere les fautes.")
            for num, libelle, cible in introuvables:
                self.stdout.write(f"  {num}  \"{libelle}\"")
                pistes = sorted(
                    ((ressemblance(cible, base), o) for o, base in ouvriers),
                    key=lambda p: -p[0])[:PISTES_MAX]
                for score, o in pistes:
                    if score >= RESSEMBLANCE_MINI:
                        self.stdout.write(
                            f"        piste {score:.0%}  #{o.pk} \"{o.nom} {o.prenom}\"  "
                            f"({grade_initial[o.pk]})")

        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  lignes lues                 : {len(lignes)}")
        self.stdout.write(f"  grades attribues            : {len(ecrits)}")
        self.stdout.write(f"  deja au grade {ABREVIATION:<14}: {len(inchanges)}")
        self.stdout.write(f"  a arbitrer                  : {len(arbitrer)}")
        self.stdout.write(f"  ecartees volontairement     : {len(ecartees)}")
        self.stdout.write(f"  sans correspondance en base : {len(introuvables)}")

        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
