"""
=============================================================================
FICHIER : apps/ouvriers/management/commands/import_grades_docx.py
RÔLE    : Importer les grades des ouvriers depuis le document Word

SOURCE
------
« ouvriers_sans_grade27082026.docx » — les 122 ouvriers sans grade, dont 81 ont
reçu une valeur. Les libellés sont libres : « Pasteur », « Pasteur Dr »,
« EVDP », « Évangéliste (EV) », « PPDP (pasteur proposant délégation
pastorale) »… `abreviation_grade()` les ramène aux sept grades officiels.

Une mention de diplôme ne change pas le grade : « Pasteur Dr » désigne un
pasteur titulaire d'un doctorat, son grade reste `P.`.

TROIS TRAITEMENTS PARTICULIERS, DÉCIDÉS AVEC LA MAÎTRISE D'OUVRAGE
------------------------------------------------------------------
1. `#333` porte « ?3A », reliquat d'une version antérieure du document où les
   grades étaient codés `2A`/`3B`. Le point d'interrogation signale le doute de
   l'auteur : la ligne est écartée (voir EXCLUES).

2. Huit lignes ont été laissées vides alors que leur grade figure dans le champ
   nom ou prénom (« CHOUKOUO | Barthélémy Délégué Pastoral »). Pour celles-ci on
   déplace l'information : le grade va dans le champ prévu, et le libellé est
   nettoyé de ce qui n'est pas le nom (voir DEDUCTIONS). C'est le seul endroit
   où cette commande réécrit un patronyme.

3. `#622` est nommé « Licencier en théologie SOUE SOUE » en base et
   « … SOUE SOUE Jacques » dans le document. Le prénom du document est retenu.

Le contrôle de libellé reste actif partout ailleurs : un identifiant décalé
attribuerait le grade d'un ouvrier à un autre.

USAGE
-----
    python manage.py import_grades_docx --dry-run
    python manage.py import_grades_docx --execute
    python manage.py import_grades_docx --execute --sans-deductions
=============================================================================
"""

import re
import unicodedata

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.geo.docx import DocxIllisible, lignes_donnees, normaliser
from apps.ouvriers.models import Grade, Ouvrier

FICHIER_DEFAUT = "/data/ouvriers_sans_grade27082026.docx"

COL_ID, COL_NOM, COL_GRADE = 0, 3, 4

# Lignes écartées : identifiant -> motif.
EXCLUES = {
    333: "valeur « ?3A » — reliquat de l'ancien codage, doute signale par l'auteur",
}

# Grade lisible dans le libellé mais absent de la colonne :
#   identifiant -> (abreviation, nom_final, prenom_final)
# Le libellé est nettoyé de la mention de grade, qui rejoint son champ.
DEDUCTIONS = {
    32:  ("D.P.",  "CHOUKOUO",        "Barthélémy"),
    258: ("D.P.",  "FOKOU",           "NGUELEWOU Théophile"),
    309: ("D.P.",  "KOUMBOU",         "Achille Frigil"),
    629: ("D.P.",  "Njoya",           "Jonas"),
    226: ("A.Ev.", "NGWANOM",         "KUATE Nathan Blaise"),
    380: ("P.P.",  "Eyambè",          "Ako Martin"),
    571: ("P.P.",  "VERLA",           "MENGNJO STEPHAN"),
    267: ("P.P.",  "NJOYA",           "Cyrille Thierry"),
}

# Libellés du document acceptés comme désignant l'ouvrier, et adoptés :
#   identifiant -> (libelle_document, nom_final, prenom_final)
ALIAS = {
    622: ("Licencier en théologie SOUE SOUE Jacques",
          "Licencier", "en théologie SOUE SOUE Jacques"),
}

# Identifiants supprimés par `fusion_doublons_ouvriers` : leur absence est
# attendue, elle ne doit pas être signalée comme une anomalie.
FUSIONNES = {532: 531, 406: 410, 240: 281}


def _sans_accents(texte):
    return unicodedata.normalize("NFD", texte or "").encode("ascii", "ignore").decode().lower()


def abreviation_grade(libelle):
    """Ramène un libellé libre à l'abréviation d'un des sept grades officiels.

    L'ordre des tests importe : les grades composés (proposant AVEC délégation)
    doivent être reconnus avant leurs composants, sinon « PPDP » serait lu
    comme un simple « pasteur proposant ».
    """
    t = _sans_accents(libelle).strip()
    if not t or t.startswith("?"):
        return None
    compact = t.replace(" ", "")

    if "ppdp" in compact or ("proposant" in t and ("delegation" in t or "del past" in t)):
        return "P.P.D.P."
    if "evdp" in compact or ("evangeliste" in t and ("delegation" in t or "del past" in t)):
        return "Ev.D.P."
    if "proposant" in t or re.match(r"^pp\b", t):
        return "P.P."
    if "aide" in t and "evangeliste" in t:
        return "A.Ev."
    if "evangeliste" in t:
        return "Ev."
    if "delegue pastoral" in t or "delegation pastorale" in t:
        return "D.P."
    if "pasteur" in t:
        return "P."
    return None


class Command(BaseCommand):
    help = "Importe les grades des ouvriers depuis le document Word."

    def add_arguments(self, parser):
        parser.add_argument("--fichier", default=FICHIER_DEFAUT)
        parser.add_argument("--execute", action="store_true",
                            help="Applique l'import. Sans ce drapeau, rien n'est ecrit.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation explicite (comportement par defaut).")
        parser.add_argument("--sans-deductions", action="store_true",
                            help="N'importe que la colonne Grade, sans les 8 lignes deduites.")
        parser.add_argument("--forcer", action="store_true",
                            help="Ecrase le grade des ouvriers qui en ont deja un.")

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]

        grades = {g.abreviation: g for g in Grade.objects.all()}

        try:
            lignes = lignes_donnees(opts["fichier"], colonnes_min=5)
        except DocxIllisible as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{'IMPORT REEL' if execute else 'SIMULATION (aucune ecriture)'} — "
            f"{len(lignes)} ligne(s) lues dans {opts['fichier']}"))

        stats = {"ecrits": 0, "deduits": 0, "vides": 0, "deja": 0, "fusionnes": 0}
        ecartees, refuses, renommes, repartition = [], [], [], {}

        with transaction.atomic():
            for l in lignes:
                ident = int(l[COL_ID])
                libelle_doc = l[COL_NOM]
                valeur = l[COL_GRADE].strip()

                if ident in FUSIONNES:
                    stats["fusionnes"] += 1
                    continue

                if ident in EXCLUES:
                    ecartees.append(f"#{ident} \"{libelle_doc}\" -> {valeur!r} — {EXCLUES[ident]}")
                    continue

                deduction = None
                if not valeur:
                    if ident in DEDUCTIONS and not opts["sans_deductions"]:
                        deduction = DEDUCTIONS[ident]
                    else:
                        stats["vides"] += 1
                        continue

                ouvrier = Ouvrier.objects.filter(pk=ident).first()
                if ouvrier is None:
                    refuses.append(f"#{ident} \"{libelle_doc}\" : aucun ouvrier a cet identifiant")
                    continue

                # Contrôle du libellé, sauf alias explicitement adopté.
                libelle_base = f"{ouvrier.nom} {ouvrier.prenom}".strip()
                if normaliser(libelle_base) != normaliser(libelle_doc):
                    if ident not in ALIAS or normaliser(ALIAS[ident][0]) != normaliser(libelle_doc):
                        refuses.append(
                            f"#{ident} libelle divergent — document \"{libelle_doc}\" "
                            f"vs base \"{libelle_base}\"")
                        continue

                abreviation = deduction[0] if deduction else abreviation_grade(valeur)
                if abreviation is None:
                    refuses.append(f"#{ident} \"{libelle_doc}\" : grade {valeur!r} non reconnu")
                    continue
                if abreviation not in grades:
                    refuses.append(
                        f"#{ident} \"{libelle_doc}\" : grade {abreviation!r} absent de la table Grade")
                    continue

                if ouvrier.grade_id is not None and not opts["forcer"]:
                    stats["deja"] += 1
                    continue

                champs = ["grade"]
                ouvrier.grade = grades[abreviation]

                # Réécriture du libellé : uniquement pour les 8 déductions
                # (le grade quitte le nom) et pour l'alias #622.
                nouveau = None
                if deduction:
                    nouveau = (deduction[1], deduction[2])
                elif ident in ALIAS:
                    nouveau = (ALIAS[ident][1], ALIAS[ident][2])
                if nouveau and (ouvrier.nom, ouvrier.prenom) != nouveau:
                    renommes.append(
                        f"#{ident} \"{libelle_base}\" -> \"{nouveau[0]} {nouveau[1]}\"")
                    ouvrier.nom, ouvrier.prenom = nouveau
                    champs += ["nom", "prenom"]

                ouvrier.save(update_fields=champs + ["updated_at"])
                repartition[abreviation] = repartition.get(abreviation, 0) + 1
                stats["ecrits"] += 1
                if deduction:
                    stats["deduits"] += 1

            if not execute:
                transaction.set_rollback(True)

        self._resumer(stats, ecartees, refuses, renommes, repartition, grades, execute)

    def _resumer(self, stats, ecartees, refuses, renommes, repartition, grades, execute):
        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  grades ecrits                   : {stats['ecrits']}"
                          f"  (dont {stats['deduits']} deduits du libelle)")
        self.stdout.write(f"  cellules vides, ignorees        : {stats['vides']}")
        self.stdout.write(f"  lignes deja fusionnees, ignorees: {stats['fusionnes']}")
        self.stdout.write(f"  deja gradees, intactes          : {stats['deja']}")
        self.stdout.write(f"  ecartees volontairement         : {len(ecartees)}")
        for e in ecartees:
            self.stdout.write(self.style.WARNING(f"      {e}"))
        self.stdout.write(f"  lignes refusees                 : {len(refuses)}")
        for r in refuses:
            self.stdout.write(self.style.ERROR(f"      {r}"))

        if renommes:
            self.stdout.write(f"\n  libelles nettoyes ({len(renommes)}) :")
            for r in renommes:
                self.stdout.write(f"      {r}")

        if repartition:
            self.stdout.write("\n  repartition des grades ecrits :")
            for abbr, grade in sorted(grades.items(), key=lambda kv: kv[1].niveau):
                if repartition.get(abbr):
                    self.stdout.write(f"      {abbr:<10} {repartition[abbr]:>3}  {grade.nom}")

        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
