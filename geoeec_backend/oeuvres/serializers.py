from rest_framework import serializers
from .models import Oeuvre
class OeuvreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oeuvre
        fields = '__all__'
