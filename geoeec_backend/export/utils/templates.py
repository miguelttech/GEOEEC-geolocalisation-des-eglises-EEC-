# export/utils/templates.py
import io
import pandas as pd

def generate_template_paroisses():
    colonnes = [
        "Nom de la paroisse", "Niveau", "Region_synodale", "districts", "Quartier",
        "Latitude", "Longitude", "Altitude", "Précision",
        "Effectif des fidèles (communiants)", "(non-communiants)", "Effectif des ouvriers"
    ]
    df = pd.DataFrame(columns=colonnes)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Paroisses")
    buffer.seek(0)
    return buffer

def generate_template_ouvriers():
    colonnes = [
        "Nom de la paroisse",
        "Noms, grades et contacts"  # Format : Nom;Grade;Contact par ligne
    ]
    df = pd.DataFrame(columns=colonnes)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Ouvriers")
    buffer.seek(0)
    return buffer

def generate_template_oeuvres():
    colonnes = [
        "Paroisse de rattachement", "Nom de l'œuvre", "Catégorie de l'œuvre",
        "Type d'œuvre", "Quartier", "Latitude", "Longitude"
    ]
    df = pd.DataFrame(columns=colonnes)
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Oeuvres")
    buffer.seek(0)
    return buffer
