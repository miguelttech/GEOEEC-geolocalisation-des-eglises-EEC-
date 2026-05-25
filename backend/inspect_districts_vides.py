"""
Script d'investigation : pourquoi 23 paroisses ont un district vide ?
On examine les lignes exactes dans l'Excel (Feuil2) pour comprendre
si c'est une question de cellules fusionnées ou de données manquantes.
"""
import os
import openpyxl

fichiers = os.listdir("/data")
f_par = next(f for f in fichiers if "paroisse" in f.lower() or "geo" in f.lower())
chemin = "/data/" + f_par

print("Fichier :", f_par)

wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)
ws = wb["Feuil2"]
rows = list(ws.iter_rows(values_only=True))
headers = rows[0]
data = rows[1:]  # lignes réelles (index 0 = ligne Excel 2)

print("En-têtes colonnes 0-5 :", [str(h)[:25] if h else "" for h in headers[:6]])
print()

# Noms des 23 paroisses ignorées (district vide)
paroisses_ignorees = {
    "Ngaoundal", "Bamemba", "Ngoulmekong1", "Bakap district de Bana",
    "BANDOUMKASSA", "Banféko", "Basseu", "Meji", "Baneghang",
    "Ndoungue A", "KASSANG", "Paroisse TIE2", "Company",
    "Paroisse de MBANKOUOP", "NEW BELL TSF", "YOUPWE", "Manjouom",
    "Mfeutom annexe de bahouoc", "Ngùendùem", "Paroisse de kaele",
    "Paroisse de SOA", "Paroisse de Takasko", "Paroisse de TIE2"
}

print("=" * 70)
print("LIGNES AVEC NOM DE PAROISSE MAIS DISTRICT VIDE")
print("(on affiche aussi les 2 lignes avant pour voir le contexte)")
print("=" * 70)

COL_REGION   = 2
COL_DISTRICT = 3
COL_NOM      = 4

for i, row in enumerate(data, start=2):  # i = numéro ligne Excel
    nom_par  = row[COL_NOM]      if len(row) > COL_NOM      else None
    district = row[COL_DISTRICT] if len(row) > COL_DISTRICT else None
    region   = row[COL_REGION]   if len(row) > COL_REGION   else None

    if not nom_par or str(nom_par).strip() == "":
        continue
    if district and str(district).strip() != "":
        continue  # district présent → pas le problème

    # On a trouvé une paroisse sans district
    # Afficher le contexte : 2 lignes avant
    print(f"\n>>> Ligne {i} | NOM='{nom_par}' | DISTRICT='{district}' | REGION='{region}'")
    print("    Contexte (lignes précédentes) :")
    for j in range(max(0, i - 3), i - 1):
        ctx_row = data[j]  # data[j] = ligne Excel j+2
        ctx_nom = ctx_row[COL_NOM]      if len(ctx_row) > COL_NOM      else ""
        ctx_dis = ctx_row[COL_DISTRICT] if len(ctx_row) > COL_DISTRICT else ""
        ctx_reg = ctx_row[COL_REGION]   if len(ctx_row) > COL_REGION   else ""
        print(f"    Ligne {j+2} | nom='{ctx_nom}' | dist='{ctx_dis}' | reg='{ctx_reg}'")

wb.close()

print()
print("=" * 70)
print("ANALYSE COMPLETE — vérifier si le district est dans la ligne précédente")
print("=" * 70)
