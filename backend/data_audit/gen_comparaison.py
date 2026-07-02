# -*- coding: utf-8 -*-
"""Génère docs/COMPARAISON_PAROISSES_BD_vs_OFFICIEL.md — tableau ligne à ligne."""
import difflib
import json
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
import django  # noqa: E402

django.setup()

from apps.geo.models import Paroisse  # noqa: E402

D = "/app/data_audit/"


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\bparoisse( de| du| d.)?\b", " ", s)
    s = re.sub(r"\beec\b", " ", s)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


# ── Source officielle (docx1) : norm → (catégorie, nom exact du document) ──
cat1 = json.load(open(D + "out_cat1.json", encoding="utf-8"))
AB = {
    "A++": ["Cinquantenaire", "Messa - Mokolo", "Biyem-Assi", "Nlongkak"],
    "A1": ["Bonamunduru", "Briqueterie 1", "Briqueterie 2", "Essos", "Mont des Oliviers",
           "New-Bell Aviation", "New-Deido", "Njimbam- Foumbot", "Bonabéri", "Bonatéki",
           "Centenaire (Act Fr)", "Company", "Melen", "Soboum", "Grand Temple", "Rue Manguiers"],
    "A2": ["Bafoussam Plateau", "Centre Martin Luther", "Maképè Tonnere", "Tamdja"],
    "B1": ["Bafang II", "Bamendzi A", "Bodomo", "Cité – Palmiers", "Koupgouo", "Messassi",
           "Ngousso Essesselakok", "Nkoldongo II", "Nkoldongo I", "Nkozoa", "Nsam Efoulan",
           "Nzintia", "Oyom Abang", "Tchitchap", "Tialong", "Toket"],
    "B2": ["Famgo", "Nkomo"],
}
officiel = {}
for cat, names in AB.items():
    for n in names:
        officiel[norm(n)] = (cat, n)
for i, tbl in enumerate(cat1):
    for n in tbl["names"]:
        officiel.setdefault(norm(n), (["C1", "C2", "C3", "C4"][i], n))
off_keys = list(officiel.keys())

# ── Paroisses BD : issues de l'ENQUÊTE (hors district NON PRÉCISÉ) ──
survey = [p for p in Paroisse.objects.select_related("district__region")
          if p.district.nom != "NON PRÉCISÉ"]
added = [p for p in Paroisse.objects.select_related("district__region")
         if p.district.nom == "NON PRÉCISÉ"]
survey.sort(key=lambda p: (p.district.region.nom, p.nom.lower()))
added.sort(key=lambda p: (p.district.region.nom, p.nom.lower()))

rows = []
matched_official_keys = set()
for p in survey:
    k = norm(p.nom)
    if k in officiel:
        cat, off = officiel[k]
        corr = "Exacte"
        matched_official_keys.add(k)
    else:
        got = difflib.get_close_matches(k, off_keys, n=1, cutoff=0.87)
        if got:
            cat, off = officiel[got[0]]
            r = difflib.SequenceMatcher(None, k, got[0]).ratio()
            corr = f"Approchée ({r:.2f})"
            matched_official_keys.add(got[0])
        else:
            cat, off, corr = p.categorie or "", "—", "AUCUNE"
    rows.append((p, off, cat, corr))

out = []
out.append("# COMPARAISON — Paroisses de la BD (enquête) ↔ Fichier officiel de catégorisation\n")
out.append("**Généré le 02/07/2026 · après fusion des doublons et intégration des catégories**\n")
out.append(f"\n- Paroisses issues de l'**enquête de géolocalisation** (BD d'origine, après fusion) : **{len(survey)}**")
out.append(f"- Paroisses **ajoutées depuis le fichier officiel** (sans GPS, district « NON PRÉCISÉ ») : **{len(added)}**")
out.append(f"- Total BD : **{len(survey) + len(added)}**\n")
exact = sum(1 for r in rows if r[3] == "Exacte")
appro = sum(1 for r in rows if r[3].startswith("Approchée"))
aucune = sum(1 for r in rows if r[3] == "AUCUNE")
out.append(f"**Correspondances** : {exact} exactes · {appro} approchées (orthographe) · {aucune} sans correspondance officielle\n")

out.append("\n---\n\n## 1. Paroisses de l'enquête ↔ nom officiel (ligne à ligne)\n")
out.append("| # | Paroisse (BD) | Région synodale | Nom dans le fichier officiel | Catégorie | Correspondance |")
out.append("|---|---|---|---|---|---|")
for i, (p, off, cat, corr) in enumerate(rows, 1):
    flag = "" if corr != "AUCUNE" else " ⚠️"
    out.append(f"| {i} | {p.nom} | {p.district.region.nom} | {off} | {cat or '—'} | {corr}{flag} |")

out.append("\n---\n\n## 2. Paroisses officielles AJOUTÉES à la BD (absentes de l'enquête, sans GPS)\n")
out.append("| # | Paroisse officielle | Région synodale | Catégorie |")
out.append("|---|---|---|---|")
for i, p in enumerate(added, 1):
    out.append(f"| {i} | {p.nom} | {p.district.region.nom} | {p.categorie or '—'} |")

# Officielles jamais utilisées (ni match ni ajout) = les 10 non plaçables
integ = json.load(open(D + "out_integration.json", encoding="utf-8"))
out.append("\n---\n\n## 3. Paroisses officielles NON intégrées (région introuvable — à préciser par le superviseur)\n")
for n in integ.get("sans_region", []):
    out.append(f"- {n}")
out.append("\n**Homonyme non tranché** : Manjouom (existe en NOUN NORD et en WOURI SUD — catégorie non attribuée)\n")

open(D + "COMPARAISON_PAROISSES.md", "w", encoding="utf-8").write("\n".join(out))
print(f"OK — {len(rows)} lignes enquête, {len(added)} ajoutées, fichier généré")
