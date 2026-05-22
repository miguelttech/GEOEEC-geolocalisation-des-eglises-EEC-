# export/utils/pdf_report.py
import io
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from paroisses.models import Paroisse
from oeuvres.models import Oeuvre
from ouvriers.models import Ouvrier

def generate_statistical_pdf():
    # Collecte des données
    total_paroisses = Paroisse.objects.count()
    total_oeuvres = Oeuvre.objects.count()
    total_ouvriers = Ouvrier.objects.count()

    regions = Paroisse.objects.values_list('region_synodale', flat=True).distinct()
    paroisses_par_region = {
        region: Paroisse.objects.filter(region_synodale=region).count()
        for region in regions
    }

    categories_oeuvres = Oeuvre.objects.values_list('categorie', flat=True).distinct()
    oeuvres_par_categorie = {
        cat: Oeuvre.objects.filter(categorie=cat).count()
        for cat in categories_oeuvres
    }

    grades = Ouvrier.objects.values_list('grade', flat=True).distinct()
    ouvriers_par_grade = {
        grade: Ouvrier.objects.filter(grade=grade).count()
        for grade in grades
    }

    # Préparation du contexte
    context = {
        "total_paroisses": total_paroisses,
        "total_oeuvres": total_oeuvres,
        "total_ouvriers": total_ouvriers,
        "paroisses_par_region": paroisses_par_region,
        "oeuvres_par_categorie": oeuvres_par_categorie,
        "ouvriers_par_grade": ouvriers_par_grade,
    }

    # Rendu HTML
    html = render_to_string("export/rapport.html", context)

    # Génération du PDF
    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(io.StringIO(html), dest=pdf_buffer)
    pdf_buffer.seek(0)

    return pdf_buffer
