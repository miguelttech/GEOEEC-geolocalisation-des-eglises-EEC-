import math

from django.contrib.auth import login
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.accounts.models import User
from apps.geo.models import Paroisse


def _send_welcome_email(user):
    """Email de bienvenue envoyé à chaque nouvel inscrit visiteur."""
    prenom = user.first_name or user.username
    try:
        send_mail(
            subject="Bienvenue sur GÉOEEC — Église Évangélique du Cameroun",
            message=(
                f"Bonjour {prenom},\n\n"
                f"Votre compte visiteur sur la plateforme GÉOEEC a été créé avec succès.\n\n"
                f"Vous pouvez maintenant accéder à la carte interactive des paroisses,\n"
                f"districts et régions synodales de l'EEC Cameroun :\n"
                f"{settings.FRONTEND_URL}/carte\n\n"
                f"Fonctionnalités disponibles avec votre compte :\n"
                f"  • Localisation des paroisses les plus proches\n"
                f"  • Enregistrement de paroisses favorites\n"
                f"  • Historique de navigation\n"
                f"  • Calcul d'itinéraires\n\n"
                f"Que Dieu vous bénisse dans votre exploration.\n\n"
                f"— L'équipe GÉOEEC · EEC Cameroun"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass

from .models import (
    ProfilVisiteur, ParoisseVue, RechercheHistorique,
    ItinerairePersonnel, ParoisseEnregistree,
)
from .serializers import (
    ProfilVisiteurSerializer, ParoisseVueSerializer,
    RechercheHistoriqueSerializer, ItinerairePersonnelSerializer,
    ParoisseEnregistreeSerializer,
)
from .permissions import IsAuthentifiedUser


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _haversine_km(lat1, lng1, lat2, lng2):
    """Distance à vol d'oiseau entre deux coordonnées GPS (en km)."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _duree_estimee(distance_km):
    """Estimation de la durée de trajet en minutes (60 km/h moyenne Cameroun)."""
    return max(1, round(distance_km / 60 * 60))


# ---------------------------------------------------------------------------
# INSCRIPTION VISITEUR
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def register_visitor(request):
    """
    POST /api/visitor/register/
    Body : { "first_name", "last_name", "email", "password" }
    Crée User(role=VISITEUR) + ProfilVisiteur, connecte immédiatement.
    """
    data       = request.data
    first_name = data.get("first_name", "").strip()
    last_name  = data.get("last_name",  "").strip()
    email      = data.get("email",      "").strip().lower()
    password   = data.get("password",   "")

    # Validation basique
    if not email or not password:
        return Response(
            {"detail": "Email et mot de passe requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(password) < 8:
        return Response(
            {"detail": "Le mot de passe doit contenir au moins 8 caractères."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"detail": "Un compte avec cet email existe déjà."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Génération du username depuis le préfixe email
    base_username = email.split("@")[0]
    username = base_username
    counter  = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role="VISITEUR",
        force_password_change=False,
    )
    # ProfilVisiteur créé via signal (voir signals.py)
    # Email de bienvenue (fail_silently — ne bloque pas l'inscription si SMTP indisponible)
    _send_welcome_email(user)
    # Connexion immédiate après inscription
    login(request, user)

    return Response(
        {
            "detail": "Compte créé avec succès.",
            "user": {
                "id":         user.id,
                "email":      user.email,
                "first_name": user.first_name,
                "last_name":  user.last_name,
                "role":       user.role,
            },
        },
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# PROFIL VISITEUR
# ---------------------------------------------------------------------------

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthentifiedUser])
def visitor_me(request):
    """
    GET  /api/visitor/me/ — Profil complet du visiteur connecté.
    PATCH /api/visitor/me/ — Modifier langue, paroisse affiliée, région préférée, notifs.
                             Aussi first_name, last_name autorisés.
    """
    user = request.user

    if request.method == "GET":
        profil = getattr(user, "profil_visiteur", None)
        return Response({
            "id":         user.id,
            "email":      user.email,
            "first_name": user.first_name,
            "last_name":  user.last_name,
            "role":       user.role,
            "date_joined":user.date_joined,
            "last_login": user.last_login,
            "profil":     ProfilVisiteurSerializer(profil).data if profil else None,
        })

    # PATCH
    # Champs User modifiables
    for field in ("first_name", "last_name"):
        if field in request.data:
            setattr(user, field, request.data[field])
    user.save(update_fields=["first_name", "last_name"])

    # Champs ProfilVisiteur modifiables
    profil, _ = ProfilVisiteur.objects.get_or_create(utilisateur=user)
    profil_serializer = ProfilVisiteurSerializer(profil, data=request.data, partial=True)
    if profil_serializer.is_valid():
        profil_serializer.save()
        return Response({"detail": "Profil mis à jour.", "profil": profil_serializer.data})
    return Response(profil_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# HISTORIQUE DE RECHERCHE
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthentifiedUser])
def search_history(request):
    """GET /api/visitor/history/ — 50 dernières recherches du visiteur connecté."""
    qs = RechercheHistorique.objects.filter(
        utilisateur=request.user
    ).order_by("-created_at")[:50]
    return Response(RechercheHistoriqueSerializer(qs, many=True).data)


@api_view(["DELETE"])
@permission_classes([IsAuthentifiedUser])
def clear_history(request):
    """DELETE /api/visitor/history/clear/ — Supprime tout l'historique."""
    count, _ = RechercheHistorique.objects.filter(utilisateur=request.user).delete()
    return Response({"detail": f"{count} entrée(s) supprimée(s)."})


# ---------------------------------------------------------------------------
# PAROISSES VUES (historique de consultation)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthentifiedUser])
def log_paroisse_vue(request, pk):
    """
    POST /api/visitor/paroisses/{pk}/vue/
    Enregistre qu'un visiteur authentifié a consulté la paroisse pk.
    Appelé par le frontend à chaque ouverture de popup paroisse.
    """
    try:
        paroisse = Paroisse.objects.get(pk=pk)
    except Paroisse.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    ParoisseVue.objects.create(utilisateur=request.user, paroisse=paroisse)
    return Response({"detail": "Vue enregistrée."}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthentifiedUser])
def paroisses_recentes(request):
    """
    GET /api/visitor/paroisses/recentes/
    Retourne les 20 dernières paroisses distinctes consultées par le visiteur.
    """
    # On déduplique : on ne garde que la dernière vue par paroisse
    seen = set()
    result = []
    qs = ParoisseVue.objects.filter(
        utilisateur=request.user
    ).select_related(
        "paroisse", "paroisse__district", "paroisse__district__region"
    ).order_by("-vue_at")

    for vue in qs:
        if vue.paroisse_id not in seen:
            seen.add(vue.paroisse_id)
            result.append(vue)
        if len(result) == 20:
            break

    return Response(ParoisseVueSerializer(result, many=True).data)


# ---------------------------------------------------------------------------
# PAROISSE LA PLUS PROCHE (PostGIS)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthentifiedUser])
def paroisse_plus_proche(request):
    """
    GET /api/visitor/paroisses/plus-proche/?lat=<float>&lng=<float>
    Trouve la paroisse EEC la plus proche d'une position GPS.
    Utilise PostGIS Distance() pour le calcul spatial exact.
    Retourne la paroisse + la distance en km.
    """
    try:
        lat = float(request.query_params.get("lat", ""))
        lng = float(request.query_params.get("lng", ""))
    except (ValueError, TypeError):
        return Response(
            {"detail": "Paramètres lat et lng requis (nombres décimaux)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return Response(
            {"detail": "Coordonnées GPS invalides."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    point = Point(lng, lat, srid=4326)

    paroisse = (
        Paroisse.objects
        .filter(position__isnull=False, est_active=True)
        .annotate(distance=Distance("position", point))
        .order_by("distance")
        .select_related("district", "district__region")
        .first()
    )

    if not paroisse:
        return Response(
            {"detail": "Aucune paroisse avec GPS disponible."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Distance en km depuis la valeur PostGIS (retournée en mètres)
    distance_km = round(paroisse.distance.km, 2)

    return Response({
        "paroisse": {
            "id":       paroisse.id,
            "nom":      paroisse.nom,
            "district": paroisse.district.nom,
            "region":   paroisse.district.region.nom,
            "lat":      paroisse.position.y,
            "lng":      paroisse.position.x,
        },
        "distance_km":    distance_km,
        "duree_minutes":  _duree_estimee(distance_km),
    })


# ---------------------------------------------------------------------------
# FAVORIS
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthentifiedUser])
def favoris_list_create(request):
    """
    GET  /api/visitor/favoris/ — Liste des paroisses enregistrées.
    POST /api/visitor/favoris/ — Ajouter une paroisse aux favoris.
                                  Body : { "paroisse": <int>, "note_personnelle": "" }
    """
    if request.method == "GET":
        qs = ParoisseEnregistree.objects.filter(
            utilisateur=request.user
        ).select_related(
            "paroisse", "paroisse__district", "paroisse__district__region"
        ).order_by("-enregistree_at")
        return Response(ParoisseEnregistreeSerializer(qs, many=True).data)

    # POST
    paroisse_id = request.data.get("paroisse")
    note        = request.data.get("note_personnelle", "")

    if not paroisse_id:
        return Response(
            {"detail": "ID de paroisse requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        paroisse = Paroisse.objects.get(pk=paroisse_id)
    except Paroisse.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    try:
        fav = ParoisseEnregistree.objects.create(
            utilisateur=request.user, paroisse=paroisse, note_personnelle=note
        )
    except IntegrityError:
        return Response(
            {"detail": "Cette paroisse est déjà dans vos favoris."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        ParoisseEnregistreeSerializer(fav).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthentifiedUser])
def favori_delete(request, pk):
    """DELETE /api/visitor/favoris/{pk}/ — Retirer des favoris (pk = id du favori)."""
    try:
        fav = ParoisseEnregistree.objects.get(pk=pk, utilisateur=request.user)
    except ParoisseEnregistree.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    fav.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# ITINÉRAIRES
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthentifiedUser])
def itineraires_list(request):
    """GET /api/visitor/itineraires/ — Historique des 20 derniers itinéraires."""
    qs = ItinerairePersonnel.objects.filter(
        utilisateur=request.user
    ).select_related(
        "depart_paroisse",
        "arrivee_paroisse", "arrivee_paroisse__district", "arrivee_paroisse__district__region"
    ).order_by("-created_at")[:20]
    return Response(ItinerairePersonnelSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthentifiedUser])
def calculer_itineraire(request):
    """
    POST /api/visitor/itineraires/calculer/
    Body :
      { "arrivee_paroisse_id": <int>,
        "depart_paroisse_id": <int>  (optionnel si coordonnées GPS fournies)
        "depart_lat": <float>,       (position actuelle du visiteur)
        "depart_lng": <float> }
    Calcule la distance à vol d'oiseau via Haversine + estime la durée.
    Enregistre l'itinéraire dans l'historique.
    """
    data = request.data

    # Destination obligatoire
    arrivee_id = data.get("arrivee_paroisse_id")
    if not arrivee_id:
        return Response(
            {"detail": "arrivee_paroisse_id est requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        arrivee = Paroisse.objects.get(pk=arrivee_id)
    except Paroisse.DoesNotExist:
        return Response(
            {"detail": "Paroisse de destination introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not arrivee.position:
        return Response(
            {"detail": "La paroisse de destination n'a pas de coordonnées GPS."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Point d'arrivée
    arrivee_lat = arrivee.position.y
    arrivee_lng = arrivee.position.x

    # Départ : soit une paroisse, soit des coordonnées GPS libres
    depart_paroisse = None
    depart_lat = depart_lng = None
    distance_km = duree_min = None

    depart_id = data.get("depart_paroisse_id")
    raw_lat   = data.get("depart_lat")
    raw_lng   = data.get("depart_lng")

    if depart_id:
        try:
            depart_paroisse = Paroisse.objects.get(pk=depart_id)
        except Paroisse.DoesNotExist:
            return Response(
                {"detail": "Paroisse de départ introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not depart_paroisse.position:
            return Response(
                {"detail": "La paroisse de départ n'a pas de coordonnées GPS."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        depart_lat = depart_paroisse.position.y
        depart_lng = depart_paroisse.position.x

    elif raw_lat is not None and raw_lng is not None:
        try:
            depart_lat = float(raw_lat)
            depart_lng = float(raw_lng)
        except (ValueError, TypeError):
            return Response(
                {"detail": "depart_lat et depart_lng doivent être des nombres."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        return Response(
            {"detail": "Fournir soit depart_paroisse_id, soit depart_lat + depart_lng."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Calcul de la distance
    distance_km = round(_haversine_km(depart_lat, depart_lng, arrivee_lat, arrivee_lng), 2)
    duree_min   = _duree_estimee(distance_km)

    # Enregistrement
    itin = ItinerairePersonnel.objects.create(
        utilisateur=request.user,
        depart_paroisse=depart_paroisse,
        depart_lat=depart_lat if not depart_paroisse else None,
        depart_lng=depart_lng if not depart_paroisse else None,
        arrivee_paroisse=arrivee,
        distance_km=distance_km,
        duree_minutes=duree_min,
    )

    return Response(
        ItinerairePersonnelSerializer(itin).data,
        status=status.HTTP_201_CREATED,
    )
