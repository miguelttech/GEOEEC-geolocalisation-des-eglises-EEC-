from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from paroisses.views import ParoisseViewSet
from ouvriers.views import OuvrierViewSet
from oeuvres.views import OeuvreViewSet
from users.views import RegisterView
# from cartographie.views import CartographyViewSet # <-- Supprimez ou commentez cette ligne

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="GEOEEC API",
        default_version='v1',
        description="Documentation de l'API GEOEEC (gestion et géolocalisation des paroisses, œuvres et utilisateurs)",
        terms_of_service="https://www.eec-cameroun.org/terms/",
        contact=openapi.Contact(email="support@eec-cameroun.org"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

router = DefaultRouter()
router.register(r'paroisses', ParoisseViewSet)
router.register(r'ouvriers', OuvrierViewSet)
router.register(r'oeuvres', OeuvreViewSet)
# router.register(r'cartographie', CartographyViewSet, basename='cartographie') # <-- Supprimez ou commentez cette ligne

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('users.urls')),
    path('api/', include('import_export.urls')),
    path('api/', include('export.urls')),
    path('api/statistiques/', include('statistiques.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/cartographie/', include('cartographie.urls')), # Cette ligne est correcte et doit rester
    
    # Swagger UI
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
