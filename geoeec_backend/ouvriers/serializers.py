from rest_framework import serializers
from .models import Ouvrier

class OuvrierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ouvrier
        fields = '__all__'
