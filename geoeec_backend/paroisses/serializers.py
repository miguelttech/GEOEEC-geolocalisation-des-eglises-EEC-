from rest_framework import serializers
from .models import Paroisse

class ParoisseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paroisse
        fields = '__all__'
