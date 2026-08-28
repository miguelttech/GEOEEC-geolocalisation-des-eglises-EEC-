"""
=============================================================================
FICHIER : apps/geo/management/commands/import_categories_docx.py
RÔLE    : Importer les catégories de paroisses depuis le document Word

SOURCE
------
« paroisses_sans_categorie26082026.docx » — les 211 paroisses non catégorisées,
dont 124 ont reçu une catégorie. Les 87 autres restent vides et sont ignorées :
la commande n'écrit que ce qui est renseigné.

CONTRÔLE DE VRAISEMBLANCE
-------------------------
La catégorie traduit une note globale (poids économique + poids démographique),
pas le seul effectif. Le remplissage a néanmoins été vérifié : les médianes de
fidèles croissent strictement avec le rang proposé (90 en C1 jusqu'à 3 195 en
A2), ce qui concorde avec la base existante.

EXCLUSION EXPLICITE
-------------------
`#4 Mont des oliviers/annexe de Djalingo` reçoit A1 dans le document pour
46 fidèles, alors que la médiane A1 est de 1 522. C'est une annexe, et sa
paroisse mère `#3 Mont des oliviers` est elle-même A1 : la catégorie du parent
a vraisemblablement été recopiée. Elle est écartée par défaut et la paroisse
reste non catégorisée — statu quo réversible, contrairement à un rang faux.
`--inclure-exclues` force son import si la catégorie est confirmée.

ALIAS TOLÉRÉS
-------------
Trois libellés du document annotent la paroisse plutôt que de la nommer
(« EEC Ndiengdam = Ndiengdam A ») ou portent une coquille (« Lafé » pour
« Lafié »). L'identité est certaine ; ils sont autorisés nommément plutôt que
par un assouplissement général du contrôle de nom, qui laisserait passer de
vraies divergences.

USAGE
-----
    python manage.py import_categories_docx --dry-run
    python manage.py import_categories_docx --execute
=============================================================================
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.geo.docx import DocxIllisible, lignes_donnees, normaliser
from apps.geo.models import Paroisse

FICHIER_DEFAUT = "/data/paroisses_sans_categorie26082026.docx"

COL_ID, COL_NOM, COL_CATEGORIE = 0, 3, 4

# Lignes écartées : identifiant -> motif.
EXCLUES = {
    4: ("A1 pour 46 fideles alors que la mediane A1 est de 1522 ; annexe dont "
        "la paroisse mere #3 est elle-meme A1 — recopie probable"),
}  # identifiant -> motif de l'exclusion

# Libellés du document acceptés comme désignant la paroisse : identifiant ->
# libellé tel qu'écrit dans le document.
ALIAS = {
    210: "EEC Ndiengdam = Ndiengdam A",
    221: "Lafé avec son annexe Latsit Bamougoum",
    484: "EEC BONAMOUNDOURU = Bonamoudourou",
}


class Command(BaseCommand):
    help = "Importe les categories de paroisses depuis le document Word."

    def add_arguments(self, parser):
        parser.add_argument("--fichier", default=FICHIER_DEFAUT)
        parser.add_argument("--execute", action="store_true",
                            help="Applique l'import. Sans ce drapeau, rien n'est ecrit.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation explicite (comportement par defaut).")
        parser.add_argument("--inclure-exclues", action="store_true",
                            help="Importe aussi les lignes ecartees par defaut (voir EXCLUES).")
        parser.add_argument("--forcer", action="store_true",
                            help="Ecrase la categorie des paroisses qui en ont deja une.")

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]
        valides = {code for code, _ in Paroisse.CATEGORIES}

        try:
            lignes = lignes_donnees(opts["fichier"], colonnes_min=5)
        except DocxIllisible as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{'IMPORT REEL' if execute else 'SIMULATION (aucune ecriture)'} — "
            f"{len(lignes)} ligne(s) lues dans {opts['fichier']}"))

        ecrits, vides, deja, ecartees = 0, 0, 0, []
        refuses, repartition = [], {}

        with transaction.atomic():
            for l in lignes:
                ident = int(l[COL_ID])
                categorie = l[COL_CATEGORIE].strip()

                if not categorie:
                    vides += 1
                    continue

                if ident in EXCLUES and not opts["inclure_exclues"]:
                    ecartees.append(
                        f"#{ident} \"{l[COL_NOM]}\" -> {categorie} — {EXCLUES[ident]}")
                    continue

                paroisse = Paroisse.objects.filter(pk=ident).first()
                if paroisse is None:
                    refuses.append(f"#{ident} \"{l[COL_NOM]}\" : aucune paroisse a cet identifiant")
                    continue

                # Le libellé doit concorder, sauf alias reconnu : un identifiant
                # décalé attribuerait la catégorie d'une paroisse à une autre.
                if normaliser(paroisse.nom) != normaliser(l[COL_NOM]):
                    if normaliser(ALIAS.get(ident, "")) != normaliser(l[COL_NOM]):
                        refuses.append(
                            f"#{ident} libelle divergent — document \"{l[COL_NOM]}\" "
                            f"vs base \"{paroisse.nom}\"")
                        continue

                if categorie not in valides:
                    refuses.append(
                        f"#{ident} \"{l[COL_NOM]}\" : categorie {categorie!r} hors nomenclature")
                    continue

                if paroisse.categorie and not opts["forcer"]:
                    deja += 1
                    continue

                paroisse.categorie = categorie
                paroisse.save(update_fields=["categorie", "updated_at"])
                repartition[categorie] = repartition.get(categorie, 0) + 1
                ecrits += 1

            if not execute:
                transaction.set_rollback(True)

        self._resumer(ecrits, vides, deja, ecartees, refuses, repartition, execute)

    def _resumer(self, ecrits, vides, deja, ecartees, refuses, repartition, execute):
        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  categories ecrites              : {ecrits}")
        self.stdout.write(f"  cellules vides, ignorees        : {vides}")
        self.stdout.write(f"  deja categorisees, intactes     : {deja}")
        self.stdout.write(f"  ecartees volontairement         : {len(ecartees)}")
        for e in ecartees:
            self.stdout.write(self.style.WARNING(f"      {e}"))
        self.stdout.write(f"  lignes refusees                 : {len(refuses)}")
        for r in refuses:
            self.stdout.write(self.style.ERROR(f"      {r}"))

        if repartition:
            self.stdout.write("\n  repartition des categories ecrites :")
            for code, _ in Paroisse.CATEGORIES:
                if repartition.get(code):
                    self.stdout.write(f"      {code:<4} {repartition[code]}")

        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
