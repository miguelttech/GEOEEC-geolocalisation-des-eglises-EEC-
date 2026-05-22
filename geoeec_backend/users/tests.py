from django.test import TestCase
from rest_framework.test import APIClient
from .models import User

class UserAuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_general = User.objects.create_user(name='admin', password='admin', role='admin_general')
        self.admin_regional = User.objects.create_user(name='regional', password='regional', role='admin_regional', region_synodale='Centre')
        self.auth_user = User.objects.create_user(name='auth', password='auth', role='auth_user')
        self.visitor = User.objects.create_user(name='visiteur', password='visiteur', role='visiteur')

    def test_me_view_authenticated(self):
        self.client.force_authenticate(user=self.auth_user)
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "auth")

    def test_user_list_admin_only(self):
        self.client.force_authenticate(user=self.admin_general)
        response = self.client.get("/api/users/admin/users/")
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(user=self.admin_regional)
        response = self.client.get("/api/users/admin/users/")
        self.assertEqual(response.status_code, 403)

    def test_user_list_regional_scope(self):
        self.client.force_authenticate(user=self.admin_regional)
        response = self.client.get("/api/users/regional/users/")
        self.assertEqual(response.status_code, 200)
