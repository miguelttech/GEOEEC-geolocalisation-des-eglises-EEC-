"""
Script d'audit des données sources EEC.
Lance avec : docker compose run --rm -v "d:/Academique/GEOEEC/data:/data" backend python audit_data.py
"""
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("ERREUR: openpyxl non installé")
    sys.exit(1)

SEPARATEUR = "=" * 70


def auditer_excel(chemin: str, nom: str):
    """Analyse complète d'un fichier Excel."""
    print(f"\n{SEPARATEUR}")
    print(f"FICHIER : {nom}")
    print(SEPARATEUR)

    try:
        wb = openpyxl.load_workbook(chemin, read_only=True, data_only=True)
    except Exception as e:
        print(f"  ERREUR ouverture : {e}")
        return

    print(f"  Feuilles dans le fichier : {wb.sheetnames}")

    for nom_feuille in wb.sheetnames:
        ws = wb[nom_feuille]
        print(f"\n  --- Feuille : '{nom_feuille}' ---")

        # Lire toutes les lignes en mémoire
        lignes = list(ws.iter_rows(values_only=True))
        if not lignes:
            print("  Feuille vide.")
            continue

        entetes = lignes[0]
        donnees = lignes[1:]

        print(f"  Nombre de colonnes : {len(entetes)}")
        print(f"  Nombre de lignes de données : {len(donnees)}")
        print(f"\n  COLONNES DÉTECTÉES :")

        for i, col in enumerate(entetes):
            if col is None:
                continue

            # Compter valeurs non-nulles, nulles, et types
            valeurs = [row[i] for row in donnees if i < len(row)]
            non_nulles = [v for v in valeurs if v is not None and str(v).strip() != ""]
            nulles = len(valeurs) - len(non_nulles)

            # Détecter le type dominant
            types = set(type(v).__name__ for v in non_nulles[:50])
            type_str = ", ".join(types) if types else "vide"

            print(f"\n  [{i+1}] Colonne : '{col}'")
            print(f"       Remplies : {len(non_nulles)} / {len(valeurs)}  |  Vides : {nulles}")
            print(f"       Type de données : {type_str}")

            # Afficher les valeurs uniques si peu nombreuses (champ catégoriel)
            uniques = list(set(str(v) for v in non_nulles if v is not None))
            if 1 < len(uniques) <= 30:
                uniques_trie = sorted(uniques)
                print(f"       Valeurs uniques ({len(uniques)}) : {uniques_trie}")
            elif len(uniques) == 1:
                print(f"       Valeur unique : '{uniques[0]}'")
            elif len(uniques) > 30:
                # Afficher quelques exemples
                exemples = sorted(uniques)[:5]
                print(f"       Trop de valeurs uniques ({len(uniques)}) — exemples : {exemples}")

        # Chercher colonnes GPS spécifiquement
        print(f"\n  ANALYSE GPS :")
        cols_lower = [str(c).lower() if c else "" for c in entetes]
        for mot in ["coord", "lat", "lon", "gps", "x", "y", "longitude", "latitude"]:
            for i, c in enumerate(cols_lower):
                if mot in c and entetes[i] not in [None, ""]:
                    vals = [row[i] for row in donnees if i < len(row) and row[i] is not None and str(row[i]).strip() != ""]
                    print(f"    Colonne GPS trouvée : '{entetes[i]}' → {len(vals)} valeurs non-vides")
                    if vals:
                        exemples = vals[:3]
                        print(f"      Exemples : {exemples}")

    wb.close()


def auditer_shapefile(chemin_shp: str):
    """Analyse le Shapefile via GDAL."""
    print(f"\n{SEPARATEUR}")
    print(f"SHAPEFILE : {chemin_shp}")
    print(SEPARATEUR)

    try:
        from osgeo import ogr, osr
    except ImportError:
        print("  ERREUR: GDAL/OGR non disponible")
        return

    ds = ogr.Open(chemin_shp)
    if ds is None:
        print("  ERREUR: impossible d'ouvrir le shapefile")
        return

    layer = ds.GetLayer(0)
    feature_count = layer.GetFeatureCount()
    print(f"  Nombre d'entités (polygones) : {feature_count}")

    # Projection
    srs = layer.GetSpatialRef()
    if srs:
        print(f"  Système de coordonnées : {srs.GetAttrValue('AUTHORITY', 0)}:{srs.GetAttrValue('AUTHORITY', 1)}")
        print(f"  Description : {srs.GetAttrValue('PROJCS') or srs.GetAttrValue('GEOGCS')}")

    # Type de géométrie
    geom_type = ogr.GeometryTypeToName(layer.GetGeomType())
    print(f"  Type de géométrie : {geom_type}")

    # Champs attributaires
    defn = layer.GetLayerDefn()
    print(f"\n  CHAMPS ATTRIBUTAIRES ({defn.GetFieldCount()} colonnes) :")
    for i in range(defn.GetFieldCount()):
        field = defn.GetFieldDefn(i)
        print(f"    [{i+1}] '{field.GetName()}' — type : {field.GetFieldTypeName(field.GetType())}, largeur : {field.GetWidth()}")

    # Lire toutes les valeurs d'un champ important (nom de la région)
    print(f"\n  TOUTES LES VALEURS DES CHAMPS (pour identifier le nom de région) :")
    layer.ResetReading()
    champs_noms = [defn.GetFieldDefn(i).GetName() for i in range(defn.GetFieldCount())]

    valeurs_par_champ = {c: [] for c in champs_noms}
    for feature in layer:
        for champ in champs_noms:
            val = feature.GetField(champ)
            if val:
                valeurs_par_champ[champ].append(str(val))

    for champ, valeurs in valeurs_par_champ.items():
        uniques = sorted(set(valeurs))
        print(f"\n  Champ '{champ}' — {len(uniques)} valeurs uniques :")
        for v in uniques:
            print(f"    → '{v}'")

    ds = None
    print(f"\n  Shapefile analysé avec succès.")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  AUDIT DES DONNÉES SOURCES — Projet EEC Géolocalisation")
    print("=" * 70)

    DATA_DIR = Path("/data")

    # --- Excel paroisses ---
    auditer_excel(
        str(DATA_DIR / "Recap_paroisses_Projet_de_géolocalisation_26mai.xlsx"),
        "Paroisses (Recap_paroisses...)"
    )

    # --- Excel ouvriers ---
    auditer_excel(
        str(DATA_DIR / "OUVRIERS.xlsx"),
        "Ouvriers (OUVRIERS.xlsx)"
    )

    # --- Excel oeuvres ---
    auditer_excel(
        str(DATA_DIR / "Recap_oeuvres_EEC_2025.xlsx"),
        "Oeuvres (Recap_oeuvres_EEC_2025.xlsx)"
    )

    # --- Shapefile régions synodales ---
    auditer_shapefile("/data/gis/Region_synodale_ok2.shp")

    print(f"\n{SEPARATEUR}")
    print("  AUDIT TERMINÉ")
    print(SEPARATEUR)
