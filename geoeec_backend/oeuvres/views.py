from rest_framework import viewsets
from .models import Oeuvre
from .serializers import OeuvreSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class OeuvreViewSet(viewsets.ModelViewSet):
    queryset = Oeuvre.objects.all()
    serializer_class = OeuvreSerializer

