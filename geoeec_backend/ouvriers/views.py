from rest_framework import viewsets
from .models import Ouvrier
from .serializers import OuvrierSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class OuvrierViewSet(viewsets.ModelViewSet):
    queryset = Ouvrier.objects.all()
    serializer_class = OuvrierSerializer

