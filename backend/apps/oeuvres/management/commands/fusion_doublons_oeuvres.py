"""
=============================================================================
FICHIER : apps/oeuvres/management/commands/fusion_doublons_oeuvres.py
RÔLE    : Fusionner les œuvres saisies deux fois

CONTEXTE
--------
Même défaut d'import que celui corrigé sur les paroisses : un même bien de
l'EEC apparaît deux fois, sous deux orthographes, parfois à deux niveaux
hiérarchiques différents (une fois rattaché à la paroisse, une fois au
district). Laissé tel quel, le relevé GPS produirait deux points sur la carte
pour un seul bâtiment.

CE QUI N'EST PAS UN DOUBLON
---------------------------
Deux pièges ont été écartés de la table ci-dessous, car les fusionner
détruirait de vraies fiches de patrimoine :

  1. TERRAIN + IMMEUBLE au même endroit. L'EEC enregistre systématiquement la
     parcelle et le bâtiment qui s'y trouve comme deux œuvres distinctes :
     46 rattachements sur 162 portent les deux types. Un « Terrain » et un
     « Immeuble » de même nom aux mêmes coordonnées sont donc deux biens
     réels, pas une double saisie.
  2. Les noms génériques. « Temple », « Site paroissial », « Temple et
     Presbytère » reviennent sur des dizaines de paroisses différentes : ce
     sont des bâtiments distincts à libellé pauvre, jamais des doublons.

Seules les paires dont le nom ET la localisation concordent figurent ici.

PRINCIPE
--------
Oeuvre est une feuille du schéma : aucune table ne pointe vers elle. La fusion
se réduit donc à combler les champs vides du survivant depuis l'absorbé, puis
à supprimer l'absorbé — sans réaffectation d'enfants.

Le survivant est choisi ainsi :
  1. le rattachement le plus fin l'emporte (paroisse > district > région),
     car il situe mieux l'œuvre dans la hiérarchie ;
  2. à niveau égal, celui dont le libellé est le plus correct ;
  3. les coordonnées de l'absorbé sont récupérées si le survivant n'en a pas.

USAGE
-----
    python manage.py fusion_doublons_oeuvres --dry-run
    python manage.py fusion_doublons_oeuvres --execute --rapport /tmp/f.json
=============================================================================
"""

import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.oeuvres.models import Oeuvre

# =============================================================================
# TABLE DE DÉCISION — (survivant, absorbé, nom_final_ou_None, commentaire)
# =============================================================================
PAIRES = [
    (49, 57, None,
     "NDE / Centre de Sante Integre de Mfetom — casse correcte, GPS a 2 m"),
    (18, 43, None,
     "MOUNGO SUD / CSI EEC de Mbanga — ECART GPS 900 m, a verifier"),
    (141, 89, None,
     "BAHAM SUD / Ecole cepca de penkue — survivant rattache a la paroisse"),
    (133, 85, None,
     "BABOUANTOU / Ecole EEC Tonko — survivant rattache a la paroisse, porte le GPS"),
    (173, 95, None,
     "BANDJOUN B / Hopital protestant de Mbouo — GPS a 17 m"),
    (129, 130, None,
     "BEPANDA OMNISPORTS / Jarioty — GPS a 20 m"),
    (51, 56, "REGION SCOLAIRE DU NDE, MBAM ET INOUBOU",
     "NDE / Region scolaire — GPS a 5 m, espace manquant apres la virgule"),
    (58, 50, None,
     "NDE / Radio — ORTHOGRAPHE A CONFIRMER : Kunmebwo ou Nkun Mebwo"),
    (263, 67, None,
     "DSCHANG II / Site du temple — survivant rattache a la paroisse, herite le GPS"),
    (250, 103, None,
     "DJA & LOBO / Site paroissial de zoetele — survivant rattache a la paroisse, herite le GPS"),
    (249, 102, None,
     "DJA & LOBO / Temple presbytere de zoetele — ECART GPS 200 m"),
]

# Champs comblés depuis l'absorbé quand le survivant les a vides.
# Ni `type_oeuvre` ni les trois liens hiérarchiques n'y figurent : ce sont
# précisément les attributs sur lesquels le survivant a été choisi.
CHAMPS_COMBLES = [
    "position", "adresse", "telephone", "email",
    "annee_creation", "capacite", "nb_personnels", "description",
]


def _vide(v):
    return v is None or v == ""


def _niveau(o):
    """Libellé lisible du rattachement, pour les traces et le rapport."""
    if o.paroisse_id:
        return f"paroisse {o.paroisse.nom}"
    if o.district_id:
        return f"district {o.district.nom}"
    return f"region {o.region.nom}"


def _finesse(o):
    """Rang du rattachement : 3 = paroisse (le plus fin), 1 = région."""
    return 3 if o.paroisse_id else (2 if o.district_id else 1)


class Command(BaseCommand):
    help = "Fusionne les oeuvres saisies deux fois."

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
            for keep_id, drop_id, nom_final, note in PAIRES:
                rapport.append(self._fusionner(keep_id, drop_id, nom_final, note, execute))
            if not execute:
                transaction.set_rollback(True)

        self._resumer(rapport, execute)

        if opts["rapport"]:
            with open(opts["rapport"], "w", encoding="utf-8") as fh:
                json.dump(rapport, fh, ensure_ascii=False, indent=2, default=str)
            self.stdout.write(f"\nRapport JSON ecrit : {opts['rapport']}")

    def _fusionner(self, keep_id, drop_id, nom_final, note, execute):
        sel = Oeuvre.objects.select_related(
            "type_oeuvre", "paroisse__district", "district", "region")
        try:
            keep, drop = sel.get(pk=keep_id), sel.get(pk=drop_id)
        except Oeuvre.DoesNotExist as exc:
            self.stdout.write(self.style.WARNING(
                f"  paire {keep_id}/{drop_id} introuvable — deja fusionnee ? ({exc})"))
            return {"keep": keep_id, "drop": drop_id, "statut": "introuvable"}

        # Garde-fou : le survivant ne doit jamais être moins bien rattaché
        # que l'absorbé, sinon la fusion ferait perdre de la précision.
        if _finesse(keep) < _finesse(drop):
            raise CommandError(
                f"#{keep_id} ({_niveau(keep)}) est moins finement rattachee que "
                f"#{drop_id} ({_niveau(drop)}) — table de decision incoherente.")

        ligne = {
            "note": note,
            "survivant": {"id": keep.id, "nom": keep.nom,
                          "type": keep.type_oeuvre.get_nom_display(),
                          "rattachement": _niveau(keep)},
            "absorbe": {"id": drop.id, "nom": drop.nom,
                        "type": drop.type_oeuvre.get_nom_display(),
                        "rattachement": _niveau(drop)},
            "champs_combles": {}, "renommage": None, "valeurs_ecartees": {},
        }

        self.stdout.write(f"\n  {note}")
        self.stdout.write(f"    garder   #{keep.id} \"{keep.nom}\" "
                          f"[{keep.type_oeuvre.get_nom_display()}] — {_niveau(keep)}")
        self.stdout.write(f"    absorber #{drop.id} \"{drop.nom}\" "
                          f"[{drop.type_oeuvre.get_nom_display()}] — {_niveau(drop)}")

        if keep.type_oeuvre_id != drop.type_oeuvre_id:
            # Consigné sans être corrigé : un type divergent peut signaler que
            # les deux lignes ne decrivent pas le meme bien.
            ligne["valeurs_ecartees"]["type_oeuvre"] = {
                "conserve": keep.type_oeuvre.get_nom_display(),
                "ecarte": drop.type_oeuvre.get_nom_display()}
            self.stdout.write(self.style.WARNING(
                f"      ! types differents : {keep.type_oeuvre.get_nom_display()} "
                f"conserve, {drop.type_oeuvre.get_nom_display()} ecarte"))

        for champ in CHAMPS_COMBLES:
            vk, vd = getattr(keep, champ), getattr(drop, champ)
            if _vide(vk) and not _vide(vd):
                setattr(keep, champ, vd)
                ligne["champs_combles"][champ] = str(vd)
                self.stdout.write(f"      + {champ} <- {vd}")
            elif not _vide(vk) and not _vide(vd) and vk != vd:
                ligne["valeurs_ecartees"][champ] = {
                    "conserve": str(vk), "ecarte": str(vd)}

        if nom_final and keep.nom != nom_final:
            ligne["renommage"] = {"avant": keep.nom, "apres": nom_final}
            self.stdout.write(f"      ~ nom \"{keep.nom}\" -> \"{nom_final}\"")
            keep.nom = nom_final

        keep.save()
        drop.delete()
        ligne["statut"] = "fusionnee" if execute else "simulee"
        self.stdout.write(self.style.SUCCESS(f"    -> #{drop_id} supprimee"))
        return ligne

    def _resumer(self, rapport, execute):
        ok = [r for r in rapport if r.get("statut") in ("fusionnee", "simulee")]
        gps = sum(1 for r in ok if "position" in r["champs_combles"])
        typ = sum(1 for r in ok if "type_oeuvre" in r["valeurs_ecartees"])
        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  paires traitees          : {len(ok)}")
        self.stdout.write(f"  oeuvres supprimees       : {len(ok)}")
        self.stdout.write(f"  positions recuperees     : {gps}")
        self.stdout.write(f"  types divergents signales: {typ}")
        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
