# export/urls.py
from django.urls import path, include
from .views import ExportParoissesExcelView
from .views import ExportOeuvresExcelView
from .views import ExportOuvriersExcelView
from.views import ExportRapportPDFView
from .views import (
    ExportTemplateParoissesView,
    ExportTemplateOuvriersView,
    ExportTemplateOeuvresView
)

urlpatterns = [
    path('export/paroisses/', ExportParoissesExcelView.as_view(), name='export_paroisses_excel'),
    path('export/oeuvres/', ExportOeuvresExcelView.as_view(), name='export_oeuvres_excel'),
    path('export/ouvriers/', ExportOuvriersExcelView.as_view()),
    path('export/rapport/', ExportRapportPDFView.as_view(), name='export_rapport_pdf'),
    path('export/template/paroisses/', ExportTemplateParoissesView.as_view(), name='template_paroisses'),
    path('export/template/ouvriers/', ExportTemplateOuvriersView.as_view(), name='template_ouvriers'),
    path('export/template/oeuvres/', ExportTemplateOeuvresView.as_view(), name='template_oeuvres'),
]
