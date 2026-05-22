from rest_framework import viewsets
from .models import Paroisse
from .serializers import ParoisseSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class ParoisseViewSet(viewsets.ModelViewSet):
    queryset = Paroisse.objects.all()
    serializer_class = ParoisseSerializer
    
