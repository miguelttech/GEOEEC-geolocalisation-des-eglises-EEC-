"""
Script de comptage precis des vraies paroisses dans le fichier Excel.
Le script distingue : vraies paroisses / separateurs de districts / lignes vides.
"""
import os
import openpyxl

fichiers = os.listdir("/data")
f_par = next(f for f in fichiers if "paroisse" in f.lower() or "geo" in f.lower())

wb = openpyxl.load_workbook("/data/" + f_par, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
headers = rows[0]
data = rows[1:]

print("=" * 55)
print("COMPTAGE PRECIS DES PAROISSES")
print("=" * 55)
print("Total lignes apres en-tete :", len(data))
print()

vides = []
sans_nom = []
avec_nom = []

for i, row in enumerate(data, start=2):
    nom = row[4] if len(row) > 4 else None
    region = row[2] if len(row) > 2 else None
    district = row[3] if len(row) > 3 else None
    vals = [v for v in row if v is not None and str(v).strip() != ""]

    if not vals:
        vides.append(i)
    elif not nom or str(nom).strip() == "":
        sans_nom.append({
            "ligne": i,
            "region": str(region),
            "district": str(district),
            "contenu": str(vals[:4])
        })
    else:
        avec_nom.append(str(nom).strip())

print("Lignes completement vides      :", len(vides))
print("Lignes separateurs (sans nom)  :", len(sans_nom))
print("VRAIES PAROISSES avec nom      :", len(avec_nom))
print()
print("--- Exemples de lignes separateurs ---")
for x in sans_nom[:20]:
    print("  Ligne", x["ligne"], "| Region=", x["region"][:30], "| Contenu=", x["contenu"][:80])
