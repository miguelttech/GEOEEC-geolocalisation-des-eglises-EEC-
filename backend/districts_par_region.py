"""
Script d'aide : affiche tous les districts existants dans chaque région concernée.
Objectif : identifier quel district assigner aux paroisses avec district manquant.
"""
import os
import openpyxl

fichiers = os.listdir("/data")
f_par = next(f for f in fichiers if "paroisse" in f.lower() or "geo" in f.lower())

wb = openpyxl.load_workbook("/data/" + f_par, read_only=True, data_only=True)
ws = wb["Feuil2"]
rows = list(ws.iter_rows(values_only=True))
data = rows[1:]

COL_REGION   = 2
COL_DISTRICT = 3
COL_NOM      = 4

# Régions concernées par les paroisses sans district
regions_cibles = {
    "ADAMAOUA",
    "BAMBOUTOS ET NORD OUEST",
    "CENTRE SUD 1",
    "HAUT NKAM",
    "HAUTS PLATEAUX",
    "MENOUA",
    "MOUNGO CENTRE",
    "NDE MBAM ET INOUBOU",
    "NOUN NORD",
    "NOUN SUD",
    "WOURI CENTRE",
    "WOURI SUD",
}

# Collecte : pour chaque région cible, quels districts existent ?
from collections import defaultdict
districts_par_region = defaultdict(set)

for row in data:
    nom_par  = row[COL_NOM]      if len(row) > COL_NOM      else None
    district = row[COL_DISTRICT] if len(row) > COL_DISTRICT else None
    region   = row[COL_REGION]   if len(row) > COL_REGION   else None

    if not nom_par or str(nom_par).strip() == "":
        continue
    if not region or not district:
        continue
    if str(district).strip() == "":
        continue

    region_clean = str(region).strip().upper()
    if region_clean in regions_cibles:
        districts_par_region[region_clean].add(str(district).strip().upper())

print("=" * 65)
print("DISTRICTS DISPONIBLES PAR RÉGION (pour aider l'assignation)")
print("=" * 65)

for region in sorted(regions_cibles):
    dists = sorted(districts_par_region.get(region, set()))
    print(f"\n  {region} :")
    if dists:
        for d in dists:
            print(f"    - {d}")
    else:
        print("    (aucun district valide trouvé dans cette région)")

wb.close()
