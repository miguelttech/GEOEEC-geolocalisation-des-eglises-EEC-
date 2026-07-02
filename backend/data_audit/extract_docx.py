# -*- coding: utf-8 -*-
"""Audit phase 2 — extraction complète des 3 docx → JSON."""
import json
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
from docx import Document                    # noqa: E402
from docx.document import Document as _Doc   # noqa: E402
from docx.table import Table                 # noqa: E402
from docx.text.paragraph import Paragraph    # noqa: E402
from docx.oxml.ns import qn                  # noqa: E402

D = "/app/data_audit/"


def iter_blocks(doc: _Doc):
    for child in doc.element.body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, doc)
        elif child.tag == qn("w:tbl"):
            yield Table(child, doc)


def cell_lines(cell):
    return [p.text.strip() for p in cell.paragraphs if p.text.strip()]


def dedup_consecutive(vals):
    out = []
    for v in vals:
        if not out or out[-1] != v:
            out.append(v)
    return out


# ═══ 1. Catégorisation 02062026 : titres interleavés + 4 tableaux de noms ═══
doc = Document(D + "Catégorisation des paroisses  EEC-1 02062026.docx")
print("### DOCX 1 — Catégorisation 02062026 : ordre des blocs ###")
cat1 = []            # [{heading, names}]
pending = []         # derniers paragraphes avant le tableau
for blk in iter_blocks(doc):
    if isinstance(blk, Paragraph):
        t = blk.text.strip()
        if t:
            pending.append(t)
    else:
        heading = " | ".join(pending[-3:])
        names = []
        for row in blk.rows:
            uniq = dedup_consecutive([c.text.strip() for c in row.cells])
            for n in uniq:
                if n:
                    names.append(n)
        cat1.append({"heading": heading, "count": len(names), "names": names})
        print(f"\nTABLEAU ({len(names)} noms) précédé de :")
        for p in pending[-6:]:
            print(f"   | {p[:120]}")
        pending = []
print("\nParagraphes APRÈS le dernier tableau :")
for p in pending[:10]:
    print(f"   | {p[:120]}")
json.dump(cat1, open(D + "out_cat1.json", "w", encoding="utf-8"), ensure_ascii=False)

# ═══ 2. Catégorisation par région 010626 : cat × région → paroisses ═══
doc = Document(D + "Catégorisation des paroisses par regionEEC-1 010626 (1).docx")
cat2 = []            # [{categorie, region, paroisses[]}]
for t in doc.tables:
    headers = [c.text.strip() for c in t.rows[0].cells]
    for row in t.rows[1:]:
        cells = row.cells
        cat = cells[0].text.strip()
        for ci in range(1, len(headers)):
            region = headers[ci]
            for name in cell_lines(cells[ci]):
                # une cellule peut contenir plusieurs noms séparés par ; ou retours
                for part in re.split(r"[;\n]| {2,}|\xa0;", name):
                    p = part.strip(" \xa0;-")
                    if p and p != "-":
                        cat2.append({"cat": cat, "region": region, "paroisse": p})
print(f"\n### DOCX 2 — par région : {len(cat2)} entrées (cat,région,paroisse)")
cats = sorted({e["cat"] for e in cat2})
regs = sorted({e["region"] for e in cat2})
print(f"Catégories : {cats}")
print(f"Régions ({len(regs)}) : {regs}")
json.dump(cat2, open(D + "out_cat2.json", "w", encoding="utf-8"), ensure_ascii=False)

# ═══ 3. Classification fidèles 19_06_2023 : paroisse → effectifs ═══
doc = Document(D + "Classification des paroisses par nombres de fidèle_19_06_2023.docx")
fid = []             # [{region, tranche, paroisse, total, n1, n2}]
anomalies = []
for t in doc.tables:
    region, tranche = "?", "?"
    for row in t.rows:
        uniq = dedup_consecutive([c.text.strip().replace(" ", " ") for c in row.cells])
        uniq = [u for u in uniq if u != ""]
        if not uniq:
            continue
        joined = " ".join(uniq)
        if "Région synodale" in joined or "Region synodale" in joined:
            region = uniq[0]
            continue
        nums = [u for u in uniq if re.fullmatch(r"[\d ]+", u)]
        nonnums = [u for u in uniq if not re.fullmatch(r"[\d ]+", u)]
        if nonnums and not nums:
            tranche = nonnums[0]
            continue
        if nums and not nonnums:
            continue                      # ligne de total régional
        if nonnums and nums:
            name = nonnums[0]
            vals = [int(n.replace(" ", "")) for n in nums]
            rec = {"region": region, "tranche": tranche, "paroisse": name,
                   "total": vals[0] if vals else None,
                   "n1": vals[1] if len(vals) > 1 else None,
                   "n2": vals[2] if len(vals) > 2 else None}
            fid.append(rec)
            if len(vals) >= 3 and vals[1] + vals[2] != vals[0]:
                anomalies.append(rec)
print(f"\n### DOCX 3 — fidèles : {len(fid)} paroisses extraites")
tot = sum(r["total"] or 0 for r in fid)
print(f"Somme des totaux : {tot} (annoncé : 276 076)")
print(f"Anomalies n1+n2≠total : {len(anomalies)}")
for a in anomalies[:5]:
    print(f"   ! {a}")
regions_f = sorted({r['region'] for r in fid})
print(f"Régions ({len(regions_f)}) : {[r[:40] for r in regions_f]}")
json.dump(fid, open(D + "out_fideles.json", "w", encoding="utf-8"), ensure_ascii=False)
