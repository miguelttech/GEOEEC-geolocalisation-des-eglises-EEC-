"""Extrait les grades uniques de la colonne 22 d'OUVRIERS.xlsx."""
import openpyxl

wb = openpyxl.load_workbook("/data/OUVRIERS.xlsx", read_only=True, data_only=True)
ws = wb["Sheet1"]
rows = list(ws.iter_rows(values_only=True))

grades = {}
for r in rows[1:]:
    g = r[22] if len(r) > 22 else None
    if g and str(g).strip():
        k = str(g).strip()
        grades[k] = grades.get(k, 0) + 1

print(f"Grades uniques : {len(grades)}")
print()
for g, n in sorted(grades.items(), key=lambda x: -x[1]):
    print(f"  {n:4d}x  '{g}'")

wb.close()
