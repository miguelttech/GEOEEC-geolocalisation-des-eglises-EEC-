# users/permissions.py
from rest_framework.permissions import BasePermission

class IsAdminGeneral(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin_general'

class IsAdminRegional(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin_regional'

class IsAuthenticatedUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'utilisateur_auth'

class IsPublicUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'visiteur'

class IsAdminGeneralOrRegional(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin_general', 'admin_regional']
