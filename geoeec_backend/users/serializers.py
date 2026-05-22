# users/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'region_synodale', 'password']

    def create(self, validated_data):
        # Utiliser create_user pour hasher le mot de passe
        return User.objects.create_user(**validated_data)
