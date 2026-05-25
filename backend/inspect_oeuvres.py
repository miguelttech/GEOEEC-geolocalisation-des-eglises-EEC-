"""
Script d'inspection du fichier Oeuvres.
But : comprendre exactement la structure (colonnes, valeurs) pour concevoir l'import.
"""
import os
import openpyxl

fichiers = os.listdir("/data")
f_oeuv = next(f for f in fichiers if "oeuvre" in f.lower())
chemin = "/data/" + f_oeuv

print("Fichier :", f_oeuv)
wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)

for sh_name in wb.sheetnames:
    ws = wb[sh_name]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        continue

    print(f"\n=== Feuille : {sh_name} ({len(rows)} lignes total) ===")
    headers = rows[0]
    print("\nEn-têtes (index : valeur) :")
    for i, h in enumerate(headers):
        print(f"  [{i:2d}] {str(h)[:60] if h else '(vide)'}")

    print(f"\n10 premières lignes de données :")
    for i, row in enumerate(rows[1:11], start=2):
        vals = [str(v)[:20] if v is not None else "" for v in row]
        print(f"  Ligne {i:3d} | {' | '.join(vals[:10])}")

    print(f"\nValeurs uniques dans la colonne 0 (région) :")
    regions = [str(r[0]).strip() for r in rows[1:] if r[0] and str(r[0]).strip()]
    for reg in regions:
        print(f"  - {reg}")

wb.close()
