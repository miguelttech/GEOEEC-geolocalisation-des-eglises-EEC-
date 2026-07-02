# -*- coding: utf-8 -*-
"""
1. Analyse : les effectifs du docx (19/06/2023) et ceux de la BD (enquête 2025)
   appartiennent-ils à la même campagne statistique ?
2. Import : création des StatistiqueAnnuelle(annee=2023) pour les paroisses
   COMMUNES uniquement (aucune création de paroisse), puis mise à jour de
   Paroisse.nombre_fideles = total de l'année la plus récente disponible.

CONVENTION RETENUE (conjecture H2, validée à 91 % contre la BD — à confirmer
par le superviseur ; une inversion se corrige en un seul UPDATE SQL) :
  colonne 3 du document (n1) = NON-COMMUNIANTS
  colonne 4 du document (n2) = COMMUNIANTS
"""
import difflib
import json
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
import django  # noqa: E402

django.setup()

from django.db.models import Max                       # noqa: E402
from apps.geo.models import Paroisse                   # noqa: E402
from apps.accounts.models import StatistiqueAnnuelle   # noqa: E402

D = "/app/data_audit/"


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\bparoisse( de| du| d.)?\b", " ", s)
    s = re.sub(r"\beec\b", " ", s)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def norm_region(s):
    n = norm(s).replace("&", "et")
    n = re.sub(r"\bregion synodale (de la|de l|du|des|de)?\b", " ", n)
    n = n.replace(" et ", " ")
    return " ".join(sorted(n.split()))


fid = json.load(open(D + "out_fideles.json", encoding="utf-8"))
paroisses = list(Paroisse.objects.select_related("district__region"))
by_norm = {}
for p in paroisses:
    by_norm.setdefault(norm(p.nom), []).append(p)
keys = list(by_norm.keys())
stats25 = {s.paroisse_id: s for s in StatistiqueAnnuelle.objects.filter(annee=2025)}


def find(rec):
    """Retrouve la paroisse BD (région du document pour départager les homonymes)."""
    k = norm(rec["paroisse"])
    cands = by_norm.get(k)
    if not cands:
        got = difflib.get_close_matches(k, keys, n=1, cutoff=0.90)
        if not got:
            return None
        cands = by_norm[got[0]]
    if len(cands) == 1:
        return cands[0]
    hint = norm_region(rec["region"])
    same = [p for p in cands if norm_region(p.district.region.nom) == hint]
    return same[0] if len(same) == 1 else None


# ═══ 1. MÊME CAMPAGNE OU PAS ? — répartition des écarts ═══
buckets = {"identiques (0 %)": 0, "faible écart (≤10 %)": 0,
           "écart modéré (10-25 %)": 0, "totalement différents (>25 %)": 0}
n_cmp = 0
for rec in fid:
    p = find(rec)
    if not p:
        continue
    s = stats25.get(p.id)
    if not s or rec["total"] is None:
        continue
    bd_total = s.communiants + s.non_communiants
    if bd_total == 0:
        continue
    n_cmp += 1
    ecart = abs(rec["total"] - bd_total) / max(rec["total"], bd_total)
    if ecart == 0:
        buckets["identiques (0 %)"] += 1
    elif ecart <= 0.10:
        buckets["faible écart (≤10 %)"] += 1
    elif ecart <= 0.25:
        buckets["écart modéré (10-25 %)"] += 1
    else:
        buckets["totalement différents (>25 %)"] += 1

print("═══ 1. COMPARAISON DES EFFECTIFS (paroisses communes avec stats 2025) ═══")
print(f"Paroisses comparées : {n_cmp}")
for k, v in buckets.items():
    print(f"  {k:28s} : {v:4d}  ({v*100//max(n_cmp,1)} %)")

# ═══ 2. IMPORT année 2023 (paroisses communes uniquement) ═══
created, skipped_nomatch, skipped_dup, homonymes = 0, 0, 0, 0
seen = set()
for rec in fid:
    k = norm(rec["paroisse"])
    if rec["total"] is None:
        continue
    p = find(rec)
    if p is None:
        # homonyme non départagé ou introuvable
        if by_norm.get(k) and len(by_norm[k]) > 1:
            homonymes += 1
        else:
            skipped_nomatch += 1
        continue
    if p.id in seen:                       # doublon interne du document
        skipped_dup += 1
        continue
    seen.add(p.id)
    StatistiqueAnnuelle.objects.update_or_create(
        paroisse=p, annee=2023,
        defaults={
            # Convention H2 : n2 = communiants, n1 = non-communiants
            "communiants":     rec["n2"] or 0,
            "non_communiants": rec["n1"] or 0,
            "validee": False,
        },
    )
    created += 1

print(f"\n═══ 2. IMPORT STATISTIQUES 2023 ═══")
print(f"Importées : {created} | introuvables (non importées) : {skipped_nomatch} | "
      f"doublons internes ignorés : {skipped_dup} | homonymes non départagés : {homonymes}")

# ═══ 3. Paroisse.nombre_fideles = total de l'année la plus récente ═══
maj = 0
derniere = (StatistiqueAnnuelle.objects.values("paroisse")
            .annotate(annee_max=Max("annee")))
annee_max_map = {r["paroisse"]: r["annee_max"] for r in derniere}
for s in StatistiqueAnnuelle.objects.all():
    if annee_max_map.get(s.paroisse_id) != s.annee:
        continue
    total = s.communiants + s.non_communiants
    Paroisse.objects.filter(id=s.paroisse_id).exclude(nombre_fideles=total)\
        .update(nombre_fideles=total)
    maj += 1

print(f"\n═══ 3. nombre_fideles mis à jour (année la plus récente) : {maj} paroisses ═══")
print(f"Stats 2023 en base : {StatistiqueAnnuelle.objects.filter(annee=2023).count()}")
print(f"Stats 2025 en base : {StatistiqueAnnuelle.objects.filter(annee=2025).count()}")
print(f"Paroisses avec nombre_fideles : {Paroisse.objects.exclude(nombre_fideles__isnull=True).count()} / {Paroisse.objects.count()}")
