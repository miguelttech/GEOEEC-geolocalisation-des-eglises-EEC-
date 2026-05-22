from django.urls import path
from .views import ImportParoissesView
from .views import ImportOuvriersView
from .views import ImportOeuvresView
from .views import ImportParoissesView
urlpatterns = [
    path('import/paroisses/', ImportParoissesView.as_view(), name='import_paroisses'),
    path('import/ouvriers/', ImportOuvriersView.as_view(), name='import_ouvriers'),
    path('import/oeuvres/', ImportOeuvresView.as_view(), name='import_oeuvres'),
    
]
