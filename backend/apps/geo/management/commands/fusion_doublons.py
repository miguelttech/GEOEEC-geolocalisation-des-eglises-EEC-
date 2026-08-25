"""
=============================================================================
FICHIER : apps/geo/management/commands/fusion_doublons.py
RÔLE    : Fusionner les paroisses saisies deux fois dans un même district

CONTEXTE
--------
L'import initial a chargé certaines paroisses depuis deux sources distinctes.
Résultat : 20 paires de lignes qui désignent la même paroisse dans le même
district, avec des orthographes différentes (« Katsela » / « Paroisse de
Katsela »), chacune portant sa propre statistique annuelle, ses ouvriers et
parfois ses œuvres — les mêmes personnes et les mêmes biens, saisis deux fois.

PRINCIPE DE LA FUSION
---------------------
Pour chaque paire on désigne un SURVIVANT et un ABSORBÉ (table PAIRES).
Le choix du survivant suit, dans l'ordre :
  1. celui qui porte une catégorie officielle (elle vient du Conseil Synodal) ;
  2. celui qui porte des coordonnées GPS ;
  3. celui dont les données sont les plus complètes ;
  4. à défaut, le plus petit identifiant.

Puis, dans une transaction :
  - les champs VIDES du survivant sont comblés par ceux de l'absorbé ;
  - les enfants (statistiques, ouvriers, œuvres…) sont RATTACHÉS au survivant
    UNIQUEMENT s'il n'en possède aucun de ce type — sinon ce sont des doublons
    de ses propres enfants et ils disparaissent avec l'absorbé ;
  - les statistiques ne migrent que pour les années absentes chez le survivant
    (contrainte unique_together (paroisse, annee)) ;
  - l'absorbé est supprimé.

Tout ce qui est écarté est consigné dans le rapport JSON (--rapport), afin
qu'aucune valeur divergente ne soit perdue sans trace.

USAGE
-----
    python manage.py fusion_doublons --dry-run          # simulation, 20 paires
    python manage.py fusion_doublons --dry-run --seules-non-categorisees
    python manage.py fusion_doublons --execute --rapport /tmp/fusion.json
=============================================================================
"""

import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.geo.models import Paroisse

# =============================================================================
# TABLE DE DÉCISION
# =============================================================================
# (survivant, absorbé, nom_final_ou_None, commentaire)
#
# `nom_final` renomme le survivant quand le nom le plus propre des deux est
# celui de l'absorbé : on garde alors la ligne la mieux dotée, sous le meilleur
# libellé. None = le nom du survivant est déjà le bon.
#
# `both_uncat` distingue les 15 paires où AUCUNE des deux lignes n'est
# catégorisée (celles du rapport initial) des 5 paires où au moins une l'est.
PAIRES = [
    # --- 15 paires dont les deux lignes sont sans catégorie ---------------
    (299, 315, None, "ABO-SUD A / Grand Souza — enfants identiques", True),
    (124, 131, None, "BAHAM SUD / Kaffo — ECART statistique 96-22 vs 53-15", True),
    (135, 132, None, "BAHAM SUD / Wouom — stats identiques", True),
    (236, 241, "Tchitchap", "BALENG B — absorbé = coquille vide", True),
    (156, 161, None, "BANDJOUN A / Mtiéki — stats identiques", True),
    (151, 160, None, "BANDJOUN D / Katsela — stats identiques", True),
    (361, 371, "Toukop", "BANGANGTE I — ECART statistique 120-60 vs 100-20", True),
    (326, 343, None, "BANGOULAP / Bassamba — ECART 160-165 vs 140-67", True),
    (399, 429, None, "BANGOURAIN / Kourom — 2 oeuvres a transferer", True),
    (495, 497, None, "BELE-BELE 2 / Mambanda 1 — survivant porte le GPS", True),
    (22, 54, None, "CENTRE 3 / Akak — ECART 200-230 vs 208-240", True),
    (420, 435, "Njinden", "FOUMBAN 1 — ECART mineur 209 vs 208", True),
    (404, 430, None, "MALANTOUEN — ECART 198-170 vs 198-198", True),
    (516, 517, "Mbanga Bakoko logements sociaux",
     "NEW-BELL D — survivant porte le GPS", True),
    (248, 269, None, "NJOMBE-PENJA / Bonandam — ECART 58 vs 54", True),
    # --- 5 paires supplementaires : au moins une ligne est categorisee ----
    (212, 213, None, "BALENG B / Famtchouet — survivant C2, absorbé vide", False),
    (153, 164, None, "BANDJOUN B / Mbouo — survivant C4 ; 3 ouvriers + 3 oeuvres a transferer", False),
    (376, 384, None, "M.B.N / Benga I — survivant C1 + stat 2026", False),
    (95, 94, "EEC de Sambo", "KADEY / Sambo — survivant C1 ; oeuvre Presbytere a transferer", False),
    (29, 50, "Nkozoa", "CENTRE 3 / Nkozoa — les deux B1 ; ECART MAJEUR 400-100 vs 60-90", False),
]

# Champs scalaires comblés depuis l'absorbé quand le survivant les a vides.
# `district` est volontairement absent : les deux lignes sont dans le même
# district, c'est le critère qui les a appariées.
CHAMPS_COMBLES = [
    "code", "categorie", "position", "adresse", "telephone", "email",
    "annee_creation", "nombre_fideles", "cible_offrande",
]

# Politique par relation inverse.
#
#   "transferer"  : les lignes suivent toujours le survivant. Reserve aux
#                   relations qui pointent vers des COMPTES ou des PROFILS
#                   (accounts.User, visitors.ProfilVisiteur) : un administrateur
#                   rattache a la paroisse absorbee doit administrer la
#                   survivante, et supprimer un compte serait hors sujet.
#   "dedupliquer" : transferees si le survivant n'en possede aucune, sinon
#                   supprimees — ce sont alors les memes ouvriers et les memes
#                   biens, saisis une seconde fois.
#
# Oeuvre.paroisse et Ouvrier.paroisse sont en on_delete=PROTECT : ils ne
# tombent pas en cascade et DOIVENT etre supprimes explicitement, sinon la
# suppression de l'absorbe leve ProtectedError.
RELATIONS = [
    ("ouvriers", "paroisse", "dedupliquer"),
    ("oeuvres", "paroisse", "dedupliquer"),
    ("admins_paroisse", "paroisse", "transferer"),
    ("membres_affilies", "paroisse_affiliee", "transferer"),
    ("vues_visiteurs", "paroisse", "dedupliquer"),
    ("enregistrements_visiteurs", "paroisse", "dedupliquer"),
    ("itineraires_depart", "paroisse_depart", "dedupliquer"),
    ("itineraires_arrivee", "paroisse_arrivee", "dedupliquer"),
    ("itineraires_comme_depart", "depart_paroisse", "transferer"),
    ("itineraires_comme_arrivee", "arrivee_paroisse", "dedupliquer"),
]


def _vide(valeur):
    """Un champ est 'vide' s'il vaut None ou la chaîne vide (0 est une valeur)."""
    return valeur is None or valeur == ""


def _resume_stat(stat):
    """Représentation compacte d'une statistique, pour le rapport JSON."""
    return {
        f.name: getattr(stat, f.name)
        for f in stat._meta.fields
        if f.name not in ("id", "paroisse") and not _vide(getattr(stat, f.name))
    }


class Command(BaseCommand):
    help = "Fusionne les paroisses en doublon dans un même district."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute", action="store_true",
            help="Applique reellement la fusion. Sans ce drapeau, rien n'est ecrit.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Simulation explicite (comportement par defaut).",
        )
        parser.add_argument(
            "--seules-non-categorisees", action="store_true",
            help="Ne traite que les 15 paires dont aucune ligne n'a de categorie.",
        )
        parser.add_argument(
            "--rapport", default=None,
            help="Chemin d'un fichier JSON ou consigner le detail de la fusion.",
        )

    def handle(self, *args, **opts):
        if opts["execute"] and opts["dry_run"]:
            raise CommandError("--execute et --dry-run s'excluent mutuellement.")
        execute = opts["execute"]

        paires = [p for p in PAIRES if p[4]] if opts["seules_non_categorisees"] else PAIRES

        entetes = "FUSION REELLE" if execute else "SIMULATION (aucune ecriture)"
        self.stdout.write(self.style.MIGRATE_HEADING(
            f"{entetes} — {len(paires)} paire(s)"))

        rapport = []
        # Une seule transaction : soit toutes les paires passent, soit aucune.
        with transaction.atomic():
            for keep_id, drop_id, nom_final, note, _ in paires:
                rapport.append(self._fusionner(keep_id, drop_id, nom_final, note, execute))

            if not execute:
                # Annule tout ce que la simulation a pu écrire : on a mesuré
                # les effets réels sans les conserver.
                transaction.set_rollback(True)

        self._resumer(rapport, execute)

        if opts["rapport"]:
            with open(opts["rapport"], "w", encoding="utf-8") as fh:
                json.dump(rapport, fh, ensure_ascii=False, indent=2, default=str)
            self.stdout.write(f"\nRapport JSON ecrit : {opts['rapport']}")

        return None

    # -- fusion d'une paire ------------------------------------------------
    def _fusionner(self, keep_id, drop_id, nom_final, note, execute):
        try:
            keep = Paroisse.objects.select_related("district__region").get(pk=keep_id)
            drop = Paroisse.objects.select_related("district__region").get(pk=drop_id)
        except Paroisse.DoesNotExist as exc:
            # Fusion déjà passée : on le signale sans faire échouer le lot.
            self.stdout.write(self.style.WARNING(
                f"  paire {keep_id}/{drop_id} introuvable — deja fusionnee ? ({exc})"))
            return {"keep": keep_id, "drop": drop_id, "statut": "introuvable"}

        if keep.district_id != drop.district_id:
            raise CommandError(
                f"#{keep_id} et #{drop_id} ne sont pas dans le meme district — "
                "table de decision incoherente, fusion interrompue.")

        ligne = {
            "district": f"{keep.district.region.nom} > {keep.district.nom}",
            "note": note,
            "survivant": {"id": keep.id, "nom": keep.nom},
            "absorbe": {"id": drop.id, "nom": drop.nom},
            "champs_combles": {},
            "renommage": None,
            "enfants_transferes": {},
            "enfants_supprimes": {},
            "valeurs_ecartees": {},
        }

        self.stdout.write(f"\n  {ligne['district']}")
        self.stdout.write(f"    garder   #{keep.id} \"{keep.nom}\" (cat={keep.categorie})")
        self.stdout.write(f"    absorber #{drop.id} \"{drop.nom}\" (cat={drop.categorie})")

        # 1. Champs scalaires : le survivant récupère ce qui lui manque.
        for champ in CHAMPS_COMBLES:
            v_keep, v_drop = getattr(keep, champ), getattr(drop, champ)
            if _vide(v_keep) and not _vide(v_drop):
                setattr(keep, champ, v_drop)
                ligne["champs_combles"][champ] = str(v_drop)
                self.stdout.write(f"      + {champ} <- {v_drop}")
            elif not _vide(v_keep) and not _vide(v_drop) and v_keep != v_drop:
                # Divergence : le survivant garde sa valeur, l'autre est consignée.
                ligne["valeurs_ecartees"][champ] = {
                    "conserve": str(v_keep), "ecarte": str(v_drop)}

        # 2. Renommage éventuel vers le libellé le plus propre.
        if nom_final and keep.nom != nom_final:
            ligne["renommage"] = {"avant": keep.nom, "apres": nom_final}
            self.stdout.write(f"      ~ nom \"{keep.nom}\" -> \"{nom_final}\"")
            keep.nom = nom_final

        keep.save()

        # 3. Statistiques : seules les années manquantes migrent.
        annees_keep = set(keep.statistiques.values_list("annee", flat=True))
        for stat in list(drop.statistiques.all()):
            if stat.annee in annees_keep:
                ligne["valeurs_ecartees"].setdefault("statistiques", []).append(
                    {"annee": stat.annee,
                     "conserve": _resume_stat(keep.statistiques.get(annee=stat.annee)),
                     "ecarte": _resume_stat(stat)})
                ligne["enfants_supprimes"]["statistiques"] = \
                    ligne["enfants_supprimes"].get("statistiques", 0) + 1
                self.stdout.write(
                    f"      - statistique {stat.annee} de l'absorbe ecartee (doublon)")
            else:
                stat.paroisse = keep
                stat.save(update_fields=["paroisse"])
                ligne["enfants_transferes"]["statistiques"] = \
                    ligne["enfants_transferes"].get("statistiques", 0) + 1
                self.stdout.write(f"      > statistique {stat.annee} transferee")

        # 4. Autres relations, selon la politique declaree dans RELATIONS.
        for rel, champ_fk, politique in RELATIONS:
            src = getattr(drop, rel, None)
            if src is None:
                continue
            n_drop = src.count()
            if not n_drop:
                continue
            n_keep = getattr(keep, rel).count()

            if politique == "transferer" or not n_keep:
                src.update(**{champ_fk: keep})
                ligne["enfants_transferes"][rel] = n_drop
                self.stdout.write(f"      > {rel}: {n_drop} transfere(s)")
            else:
                # Doublons averes : on consigne leur libelle avant de les
                # supprimer, pour que le rapport garde trace de ce qui a saute.
                ligne["valeurs_ecartees"].setdefault("enfants_doublons", {})[rel] = [
                    str(o) for o in src.all()]
                src.all().delete()
                ligne["enfants_supprimes"][rel] = n_drop
                self.stdout.write(
                    f"      - {rel}: {n_drop} supprime(s) "
                    f"(le survivant en a deja {n_keep})")

        # 5. Zone d'influence (OneToOne) : ne migre que si le survivant n'en a pas.
        zone_drop = getattr(drop, "zone_influence", None)
        if zone_drop is not None:
            if getattr(keep, "zone_influence", None) is None:
                zone_drop.paroisse = keep
                zone_drop.save(update_fields=["paroisse"])
                ligne["enfants_transferes"]["zone_influence"] = 1
                self.stdout.write("      > zone_influence transferee")
            else:
                ligne["enfants_supprimes"]["zone_influence"] = 1

        # 6. Suppression de l'absorbé (ses enfants restants tombent en cascade).
        drop.delete()
        ligne["statut"] = "fusionnee" if execute else "simulee"
        self.stdout.write(self.style.SUCCESS(f"    -> #{drop_id} supprimee"))
        return ligne

    # -- synthèse ----------------------------------------------------------
    def _resumer(self, rapport, execute):
        ok = [r for r in rapport if r.get("statut") in ("fusionnee", "simulee")]
        transferts = sum(sum(r["enfants_transferes"].values()) for r in ok)
        supprimes = sum(sum(r["enfants_supprimes"].values()) for r in ok)
        ecarts = [r for r in ok if r["valeurs_ecartees"]]

        self.stdout.write(self.style.MIGRATE_HEADING("\nSYNTHESE"))
        self.stdout.write(f"  paires traitees        : {len(ok)}")
        self.stdout.write(f"  paroisses supprimees   : {len(ok)}")
        self.stdout.write(f"  enfants transferes     : {transferts}")
        self.stdout.write(f"  enfants doublons purges: {supprimes}")
        self.stdout.write(f"  paires a valeurs divergentes : {len(ecarts)}")
        if not execute:
            self.stdout.write(self.style.WARNING(
                "\n  SIMULATION — transaction annulee, la base est inchangee."
                "\n  Relancer avec --execute pour appliquer."))
