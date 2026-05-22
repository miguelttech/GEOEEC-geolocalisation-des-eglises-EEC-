# statistiques/urls.py

from django.urls import path
from .views import StatistiquesView  
from .views import ExportStatistiquesPDFView 

urlpatterns = [
    path('', StatistiquesView.as_view(), name='statistiques'),
    path('export/pdf/', ExportStatistiquesPDFView.as_view(), name='export_pdf')
]
