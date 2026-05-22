from django.contrib import admin
from django.urls import path, include
from users.views import MeView, UserListView, RegionalUserListView, RegisterView

urlpatterns = [
    path('api/me/', MeView.as_view(), name='me'),
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/users/regional/', RegionalUserListView.as_view(), name='user-list-regional'),
    path('api/register/', RegisterView.as_view(), name='register'),
]