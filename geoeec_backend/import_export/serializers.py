from rest_framework import serializers
from .models import Oeuvre
from paroisses.models import Paroisse

class OeuvreSerializer(serializers.ModelSerializer):
    paroisse = serializers.PrimaryKeyRelatedField(queryset=Paroisse.objects.all())

    class Meta:
        model = Oeuvre
        fields = '__all__'
