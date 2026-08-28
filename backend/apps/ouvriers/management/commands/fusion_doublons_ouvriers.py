"""
=============================================================================
FICHIER : apps/ouvriers/management/commands/fusion_doublons_ouvriers.py
RÔLE    : Fusionner les ouvriers saisis deux fois sur une même paroisse

CONTEXTE
--------
Même défaut d'import que celui corrigé sur les paroisses et les œuvres : la
même personne apparaît deux fois sur la même paroisse, sous deux orthographes.
Le document « ouvriers_sans_grade27082026.docx » l'a confirmé en attribuant le
même grade aux deux lignes de deux des trois paires.

Il faut fusionner AVANT d'importer les grades : sinon l'import créerait deux
pasteurs identiques sur la même paroisse.

PRINCIPE
--------
Ouvrier est une feuille du schéma : aucune table ne pointe vers elle. La fusion
se réduit à combler les champs vides du survivant depuis l'absorbé, puis à
supprimer l'absorbé.

Le survivant est celui dont le patronyme est le mieux formé : plusieurs lignes
portent un titre collé au nom (« RévKenne » pour « KENNE ») ou un diplôme dans
le prénom, séquelles de la saisie initiale.

USAGE
-----
    python manage.py fusion_doublons_ouvriers --dry-run
    python manage.py fusion_doublons_ouvriers --execute
=============================================================================
"""

import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.ouvriers.models import Ouvrier

# (survivant, absorbé, commentaire)
PAIRES = [
    (531, 532,
     "PAROISSE DE LA CARRIERE / MOMENI Guy Marcel — lignes identiques, "
     "seul le dernier chiffre du telephone differe"),
    (410, 406,
     "New Bell source / KENNE Aubert — survivant mieux nomme "
     "(l'absorbe portait « RevKenne » en guise de patronyme), telephone recupere"),
    (281, 240,
     "Jourdain de beka hossere / TCHANA KAMDEM DIKENS — survivant sans diplome "
     "colle au prenom ; variantes phonetiques du meme nom"),
]

# Champs comblés depuis l'absorbé quand le survivant les a vides.
# `paroisse` est absent : c'est le critère qui a apparié les deux lignes.
CHAMPS_COMBLES = ["sexe", "grade", "telephone", "email",
                  "date_naissance", "date_ordination", "statut"]


def _vide(v):
    return v is None or v == ""


class Command(BaseCommand):
    help = "Fusionne les ouvriers saisis deux fois sur une meme paroisse."

    def add_arguments(self, parser):
        parser.add_argument("--execute", action="store_true",
                            help="Applique la fusion. Sans ce drapeau, rien n'est ecrit.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Simulation explicite (comportement par defaut).")
        parser.add_argument("--rapport", default=None,
                            help="Chemin d'un fichier JSON de compte rendu.")

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{'FUSION REELLE' if execute else 'SIMULATION (aucune ecriture)'} "
            f"— {len(PAIRES)} paire(s)"))

        rapport = []
        with transaction.atomic():
            for keep_id, drop_id, note in PAIRES:
                rapport.append(self._fusionner(keep_id, drop_id, note))
            if not execute:
                transaction.set_rollback(True)

        ok = [r for r in rapport if r.get("statut") == "fusionnee"]
        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  paires traitees     : {len(ok)}")
        self.stdout.write(f"  ouvriers supprimes  : {len(ok)}")
        self.stdout.write(
            f"  champs recuperes    : {sum(len(r['champs_combles']) for r in ok)}")

        if opts["rapport"]:
            with open(opts["rapport"], "w", encoding="utf-8") as fh:
                json.dump(rapport, fh, ensure_ascii=False, indent=2, default=str)
            self.stdout.write(f"\nRapport JSON ecrit : {opts['rapport']}")

        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))

    def _fusionner(self, keep_id, drop_id, note):
        sel = Ouvrier.objects.select_related("paroisse", "grade")
        try:
            keep, drop = sel.get(pk=keep_id), sel.get(pk=drop_id)
        except Ouvrier.DoesNotExist as exc:
            self.stdout.write(self.style.WARNING(
                f"  paire {keep_id}/{drop_id} introuvable — deja fusionnee ? ({exc})"))
            return {"keep": keep_id, "drop": drop_id, "statut": "introuvable"}

        if keep.paroisse_id != drop.paroisse_id:
            raise CommandError(
                f"#{keep_id} et #{drop_id} ne sont pas sur la meme paroisse — "
                "table de decision incoherente, fusion interrompue.")

        ligne = {
            "paroisse": keep.paroisse.nom, "note": note,
            "survivant": {"id": keep.id, "libelle": f"{keep.nom} {keep.prenom}".strip()},
            "absorbe": {"id": drop.id, "libelle": f"{drop.nom} {drop.prenom}".strip()},
            "champs_combles": {}, "valeurs_ecartees": {},
        }

        self.stdout.write(f"\n  {note}")
        self.stdout.write(f"    garder   #{keep.id} \"{keep.nom} {keep.prenom}\"")
        self.stdout.write(f"    absorber #{drop.id} \"{drop.nom} {drop.prenom}\"")

        for champ in CHAMPS_COMBLES:
            vk, vd = getattr(keep, champ), getattr(drop, champ)
            if _vide(vk) and not _vide(vd):
                setattr(keep, champ, vd)
                ligne["champs_combles"][champ] = str(vd)
                self.stdout.write(f"      + {champ} <- {vd}")
            elif not _vide(vk) and not _vide(vd) and vk != vd:
                ligne["valeurs_ecartees"][champ] = {
                    "conserve": str(vk), "ecarte": str(vd)}
                self.stdout.write(
                    f"      ! {champ} : {vk} conserve, {vd} ecarte")

        keep.save()
        drop.delete()
        ligne["statut"] = "fusionnee"
        self.stdout.write(self.style.SUCCESS(f"    -> #{drop_id} supprimee"))
        return ligne
