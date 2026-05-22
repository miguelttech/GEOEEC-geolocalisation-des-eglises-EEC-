# export/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import FileResponse
from export.utils.export_excel import generate_paroisses_excel
from export.utils.export_excel import generate_oeuvres_excel
from export.utils.export_excel import generate_ouvriers_excel
from export.utils.pdf_report import generate_statistical_pdf
from export.utils.templates import (
    generate_template_paroisses,
    generate_template_ouvriers,
    generate_template_oeuvres
)
from django.http import FileResponse


class ExportParoissesExcelView(APIView):
    def get(self, request):
        excel_file = generate_paroisses_excel()
        filename = "paroisses_export.xlsx"
        return FileResponse(excel_file, as_attachment=True, filename=filename)
    

class ExportOeuvresExcelView(APIView):
    def get(self, request):
        excel_file = generate_oeuvres_excel()
        filename = "oeuvres_export.xlsx"
        return FileResponse(excel_file, as_attachment=True, filename=filename)


class ExportOuvriersExcelView(APIView):
    def get(self, request):
        excel_file = generate_ouvriers_excel()
        filename = "ouvriers_export.xlsx"
        return FileResponse(excel_file, as_attachment=True, filename=filename)


class ExportRapportPDFView(APIView):
    def get(self, request):
        pdf_file = generate_statistical_pdf()
        return FileResponse(pdf_file, as_attachment=True, filename="rapport_statistique.pdf")


class ExportTemplateParoissesView(APIView):
    def get(self, request):
        buffer = generate_template_paroisses()
        return FileResponse(buffer, as_attachment=True, filename="template_paroisses.xlsx")

class ExportTemplateOuvriersView(APIView):
    def get(self, request):
        buffer = generate_template_ouvriers()
        return FileResponse(buffer, as_attachment=True, filename="template_ouvriers.xlsx")

class ExportTemplateOeuvresView(APIView):
    def get(self, request):
        buffer = generate_template_oeuvres()
        return FileResponse(buffer, as_attachment=True, filename="template_oeuvres.xlsx")
