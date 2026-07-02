# -*- coding: utf-8 -*-
"""Audit minutieux du fichier fidèles (19/06/2023) — complète le MD de comparaison."""
import difflib
import json
import re
import sys
import unicodedata
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")
import django  # noqa: E402

django.setup()

from apps.geo.models import Paroisse                 # noqa: E402
from apps.accounts.models import StatistiqueAnnuelle  # noqa: E402

D = "/app/data_audit/"


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\bparoisse( de| du| d.)?\b", " ", s)
    s = re.sub(r"\beec\b", " ", s)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def match_stats(keys_src, ref_keys):
    """exact / approché / aucun pour une liste de clés source vs un référentiel."""
    exact, appro, none_ = 0, 0, 0
    for k in keys_src:
        if k in ref_keys:
            exact += 1
        elif difflib.get_close_matches(k, ref_keys_list[id(ref_keys)], n=1, cutoff=0.87):
            appro += 1
        else:
            none_ += 1
    return exact, appro, none_


# ── Sources ──
fid = json.load(open(D + "out_fideles.json", encoding="utf-8"))
cat1 = json.load(open(D + "out_cat1.json", encoding="utf-8"))
AB_NAMES = ["Cinquantenaire", "Messa - Mokolo", "Biyem-Assi", "Nlongkak", "Bonamunduru",
            "Briqueterie 1", "Briqueterie 2", "Essos", "Mont des Oliviers", "New-Bell Aviation",
            "New-Deido", "Njimbam- Foumbot", "Bonabéri", "Bonatéki", "Centenaire (Act Fr)",
            "Company", "Melen", "Soboum", "Grand Temple", "Rue Manguiers", "Bafoussam Plateau",
            "Centre Martin Luther", "Maképè Tonnere", "Tamdja", "Bafang II", "Bamendzi A",
            "Bodomo", "Cité – Palmiers", "Koupgouo", "Messassi", "Ngousso Essesselakok",
            "Nkoldongo II", "Nkoldongo I", "Nkozoa", "Nsam Efoulan", "Nzintia", "Oyom Abang",
            "Tchitchap", "Tialong", "Toket", "Famgo", "Nkomo"]

# Référentiels
officiel_keys = {norm(n) for n in AB_NAMES}
for t in cat1:
    officiel_keys.update(norm(n) for n in t["names"])

all_par = list(Paroisse.objects.select_related("district__region"))
bd_enquete = {norm(p.nom) for p in all_par if p.district.nom != "NON PRÉCISÉ"}
bd_fusion = {norm(p.nom): p for p in all_par}
bd_fusion_keys = set(bd_fusion.keys())

ref_keys_list = {id(officiel_keys): list(officiel_keys),
                 id(bd_enquete): list(bd_enquete),
                 id(bd_fusion_keys): list(bd_fusion_keys)}

# ── 1. Doublons internes du fichier fidèles ──
cnt = Counter(norm(r["paroisse"]) for r in fid)
dups = {k: v for k, v in cnt.items() if v > 1}
dup_detail = []
for k in dups:
    entries = [r for r in fid if norm(r["paroisse"]) == k]
    regs = {r["region"][:45] for r in entries}
    kind = "HOMONYME (régions ≠)" if len(regs) > 1 else "DOUBLON (même région) ⚠️"
    dup_detail.append((entries[0]["paroisse"], len(entries),
                       " / ".join(sorted(reg.replace("Région synodale", "Rég.")[:38] for reg in regs)),
                       kind))

fid_uniq_keys = list(dict.fromkeys(norm(r["paroisse"]) for r in fid))

# ── 2. Correspondances vs les 3 référentiels ──
res = {}
for label, ref in [("BD-enquête (516)", bd_enquete),
                   ("Fichier catégories (692)", officiel_keys),
                   ("BD fusionnée actuelle (870)", bd_fusion_keys)]:
    res[label] = match_stats(fid_uniq_keys, ref)

# Paroisses du fichier fidèles introuvables PARTOUT (vraiment nouvelles)
nouvelles = []
for k in fid_uniq_keys:
    if k in bd_fusion_keys or k in officiel_keys:
        continue
    if difflib.get_close_matches(k, ref_keys_list[id(bd_fusion_keys)], n=1, cutoff=0.87):
        continue
    if difflib.get_close_matches(k, ref_keys_list[id(officiel_keys)], n=1, cutoff=0.87):
        continue
    rec = next(r for r in fid if norm(r["paroisse"]) == k)
    nouvelles.append(rec)

# ── 3. Sémantique des colonnes : comparaison avec les stats BD 2025 ──
stats = {s.paroisse_id: s for s in StatistiqueAnnuelle.objects.all()}
samples, h1_wins, h2_wins, n_cmp = [], 0, 0, 0
tot_close = 0
for r in fid:
    k = norm(r["paroisse"])
    p = bd_fusion.get(k)
    if not p:
        got = difflib.get_close_matches(k, ref_keys_list[id(bd_fusion_keys)], n=1, cutoff=0.9)
        p = bd_fusion.get(got[0]) if got else None
    if not p:
        continue
    s = stats.get(p.id)
    if not s or r["n1"] is None or r["n2"] is None or (s.communiants + s.non_communiants) == 0:
        continue
    n_cmp += 1
    e_h1 = abs(r["n1"] - s.communiants) + abs(r["n2"] - s.non_communiants)   # H1 : n1=comm
    e_h2 = abs(r["n1"] - s.non_communiants) + abs(r["n2"] - s.communiants)   # H2 : n1=non-comm
    if e_h1 < e_h2:
        h1_wins += 1
    elif e_h2 < e_h1:
        h2_wins += 1
    bd_tot = s.communiants + s.non_communiants
    if bd_tot and abs(r["total"] - bd_tot) / max(r["total"], bd_tot) < 0.25:
        tot_close += 1
    if len(samples) < 16 and min(e_h1, e_h2) / max(r["total"], 1) < 3:
        samples.append((r["paroisse"], r["total"], r["n1"], r["n2"],
                        s.communiants, s.non_communiants, "H1" if e_h1 < e_h2 else "H2"))

# ── 4. Écriture des sections dans le MD ──
out = []
out.append("\n\n---\n\n# PARTIE II — AUDIT DU FICHIER DES FIDÈLES (19/06/2023)\n")
out.append(f"**{len(fid)} lignes · {len(fid_uniq_keys)} paroisses uniques · total annoncé 276 076 fidèles**\n")

out.append("\n## 4. Doublons internes du fichier fidèles\n")
out.append(f"{len(dup_detail)} noms apparaissent plusieurs fois :\n")
out.append("| Paroisse | Occurrences | Région(s) | Diagnostic |")
out.append("|---|---|---|---|")
for nom, n, regs, kind in sorted(dup_detail, key=lambda x: x[3]):
    out.append(f"| {nom} | {n} | {regs} | {kind} |")

out.append("\n## 5. Correspondances du fichier fidèles avec les 3 référentiels\n")
out.append("| Référentiel | Exactes | Approchées | Introuvables |")
out.append("|---|---|---|---|")
for label, (e, a, x) in res.items():
    out.append(f"| {label} | {e} | {a} | {x} |")
out.append(f"\n**Paroisses du fichier fidèles absentes PARTOUT (ni BD, ni catégories, même en approché) : {len(nouvelles)}**")
out.append("→ si on importe les fidèles, ce sont elles (et elles seules) qui créeraient de nouvelles paroisses.\n")
out.append("| # | Paroisse (fidèles) | Région | Total fidèles |")
out.append("|---|---|---|---|")
for i, r in enumerate(sorted(nouvelles, key=lambda r: r["region"]), 1):
    out.append(f"| {i} | {r['paroisse']} | {r['region'].replace('Région synodale', 'Rég.')[:42]} | {r['total']} |")

out.append("\n## 6. Sémantique des colonnes n1 / n2 (test contre les stats BD 2025)\n")
out.append("Le document ne légende que la colonne « total ». Test sur les paroisses présentes")
out.append("dans les deux sources avec des statistiques 2025 non nulles :\n")
out.append(f"- Paroisses comparées : **{n_cmp}**")
out.append(f"- Hypothèse **H1 : n1 = communiants, n2 = non-communiants** → plus proche dans **{h1_wins}** cas")
out.append(f"- Hypothèse **H2 : n1 = non-communiants, n2 = communiants** → plus proche dans **{h2_wins}** cas")
out.append(f"- Totaux 2023 vs 2025 proches (écart < 25 %) : **{tot_close}/{n_cmp}** — les effectifs ont fortement évolué entre les deux enquêtes\n")
out.append("### Échantillon (à vérifier avec le superviseur)\n")
out.append("| Paroisse | Total 2023 | n1 | n2 | Communiants BD 2025 | Non-comm. BD 2025 | Hypothèse gagnante |")
out.append("|---|---|---|---|---|---|---|")
for s in samples:
    out.append(f"| {s[0]} | {s[1]} | {s[2]} | {s[3]} | {s[4]} | {s[5]} | {s[6]} |")

verdict_h = "H2 (n1 = NON-communiants, n2 = communiants)" if h2_wins > h1_wins else "H1 (n1 = communiants, n2 = non-communiants)"
pct = max(h1_wins, h2_wins) * 100 // max(n_cmp, 1)
out.append(f"\n**Conjecture : {verdict_h}** — majoritaire à {pct} %, mais les données 2025 étant elles-mêmes")
out.append("bruitées, une **confirmation du superviseur reste indispensable avant l'import**.\n")

with open(D + "COMPARAISON_PAROISSES.md", "a", encoding="utf-8") as f:
    f.write("\n".join(out))
print(f"OK — doublons internes: {len(dup_detail)} | nouvelles partout-absentes: {len(nouvelles)} | comparées: {n_cmp} | H1={h1_wins} H2={h2_wins} | totaux proches: {tot_close}")
