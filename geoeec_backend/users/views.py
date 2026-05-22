# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User
from .serializers import UserSerializer
from .permissions import IsAdminGeneral, IsAdminGeneralOrRegional
from rest_framework_simplejwt.authentication import JWTAuthentication

class MeView(APIView):

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class UserListView(APIView):

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class RegionalUserListView(APIView):

    def get(self, request):
        if request.user.role == 'admin_regional':
            users = User.objects.filter(region_synodale=request.user.region_synodale)
        else:
            users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
