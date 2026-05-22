# export/utils/export_excel.py
import io
import pandas as pd
from paroisses.models import Paroisse
from oeuvres.models import Oeuvre
from ouvriers.models import Ouvrier

def generate_paroisses_excel():
    queryset = Paroisse.objects.all().values(
        "nom", "niveau", "region_synodale", "district", "quartier",
        "latitude", "longitude", "altitude", "precision",
        "effectif_fideles", "effectif_non_communiants", "effectif_ouvriers"
    )

    df = pd.DataFrame(list(queryset))

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Paroisses")

    buffer.seek(0)
    return buffer



# export/utils/export_excel.py (ajout)

def generate_oeuvres_excel():
    queryset = Oeuvre.objects.all().values(
        "nom", "categorie", "type", "quartier", "latitude", "longitude",
        "paroisse__nom"
    )

    df = pd.DataFrame(list(queryset))
    df.rename(columns={"paroisse__nom": "paroisse"}, inplace=True)

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Oeuvres")

    buffer.seek(0)
    return buffer


# export/utils/export_excel.py (ajout)

def generate_ouvriers_excel():
    queryset = Ouvrier.objects.all().values(
        "nom", "grade", "contact", "paroisse__nom"
    )

    df = pd.DataFrame(list(queryset))
    df.rename(columns={"paroisse__nom": "paroisse"}, inplace=True)

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Ouvriers")

    buffer.seek(0)
    return buffer

