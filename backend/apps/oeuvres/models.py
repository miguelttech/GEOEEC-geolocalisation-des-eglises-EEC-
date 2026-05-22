"""
=============================================================================
FICHIER : apps/oeuvres/models.py
RÔLE    : Modèles pour les Œuvres de l'EEC

Ce fichier définit les structures de données pour les œuvres de l'EEC.
Une "œuvre" est toute infrastructure appartenant à l'EEC autre qu'une église :
école, hôpital, dispensaire, ferme, immeuble, terrain, etc.

MODÈLES :
  - TypeOeuvre : catégorie d'une œuvre (7 types prédéfinis)
  - Oeuvre     : l'œuvre elle-même, avec sa position GPS et ses informations

DÉPENDANCES :
  - django.contrib.gis.db → champs géographiques (PointField pour le GPS)
  - apps.geo.models.Paroisse → chaque œuvre est rattachée à une paroisse
=============================================================================
"""

# Import géographique : nécessaire pour PointField (coordonnées GPS de l'œuvre)
from django.contrib.gis.db import models

# Chaque œuvre appartient à une paroisse — on importe le modèle Paroisse
from apps.geo.models import Paroisse


# =============================================================================
# MODÈLE 1 : TypeOeuvre
# =============================================================================
class TypeOeuvre(models.Model):
    """
    Catégorie d'une œuvre de l'EEC.

    L'EEC possède 7 types d'œuvres définis officiellement :
      1. SCOLAIRE      → écoles primaires, collèges, lycées
      2. UNIVERSITAIRE → institutions d'enseignement supérieur
      3. MEDICALE      → hôpitaux, dispensaires, centres de santé
      4. AGROPASTORALE → fermes, élevages, cultures
      5. IMMEUBLE      → bâtiments à usage commercial ou résidentiel
      6. TERRAIN       → parcelles de terrain sans construction
      7. AUTRE         → tout ce qui ne rentre pas dans les catégories ci-dessus

    Ce modèle sert de table de référence (lookup table) : on crée les 7 types
    une seule fois en base, puis chaque œuvre pointe vers son type.
    """

    # Les 7 types officiels d'œuvres EEC
    # Format : (valeur_en_base, libellé_affiché)
    TYPES = [
        ("SCOLAIRE", "Scolaire"),
        ("UNIVERSITAIRE", "Universitaire"),
        ("MEDICALE", "Médicale"),
        ("AGROPASTORALE", "Agropastorale"),
        ("IMMEUBLE", "Immeuble"),
        ("TERRAIN", "Terrain"),
        ("AUTRE", "Autre"),
    ]

    # Nom du type (valeur parmi TYPES ci-dessus), unique : pas de doublon
    nom = models.CharField(max_length=50, choices=TYPES, unique=True)

    # Nom de l'icône à afficher sur la carte (ex: "school", "hospital", "farm")
    # Sera utilisé par le frontend Leaflet pour choisir le marqueur approprié
    icone = models.CharField(max_length=50, blank=True)

    # Couleur hexadécimale du marqueur sur la carte (ex: "#16A34A" = vert EEC)
    # Chaque type aura sa propre couleur pour différencier sur la carte
    couleur = models.CharField(max_length=7, default="#16A34A")

    class Meta:
        verbose_name = "Type d'Œuvre"
        verbose_name_plural = "Types d'Œuvre"

    def __str__(self):
        # get_nom_display() retourne le libellé lisible ("Scolaire") et non la valeur brute ("SCOLAIRE")
        return self.get_nom_display()


# =============================================================================
# MODÈLE 2 : Oeuvre
# =============================================================================
class Oeuvre(models.Model):
    """
    Représente une Œuvre de l'EEC — infrastructure non cultuelle.

    Chaque œuvre est :
      - Rattachée à une paroisse (qui la gère)
      - Classifiée par un TypeOeuvre (scolaire, médicale, etc.)
      - Localisée par des coordonnées GPS (PointField)

    Les données viennent du fichier Excel 'Recap_oeuvres_EEC_2025.xlsx'.
    """

    # Nom de l'œuvre (ex: "École Primaire de Bonanjo", "Hôpital Baptiste de Ndoungué")
    nom = models.CharField(max_length=200)

    # Catégorie de l'œuvre (pointe vers TypeOeuvre)
    # PROTECT : on ne peut pas supprimer un type si des œuvres y sont attachées
    type_oeuvre = models.ForeignKey(
        TypeOeuvre, on_delete=models.PROTECT, related_name="oeuvres"
    )

    # Paroisse gestionnaire de cette œuvre
    # PROTECT : on ne supprime pas une paroisse si elle a des œuvres actives
    # related_name="oeuvres" : paroisse.oeuvres.all() → toutes les œuvres de cette paroisse
    paroisse = models.ForeignKey(
        Paroisse, on_delete=models.PROTECT, related_name="oeuvres"
    )

    # Coordonnées GPS de l'œuvre (Point = un seul point sur la carte)
    # null=True : certaines œuvres n'ont pas encore de coordonnées
    position = models.PointField(srid=4326, null=True, blank=True)

    # Adresse physique en texte libre (ex: "Quartier Akwa, Douala, Cameroun")
    adresse = models.TextField(blank=True)

    # Informations de contact
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)

    # Année de création ou d'acquisition de l'œuvre par l'EEC
    annee_creation = models.IntegerField(null=True, blank=True)

    # Capacité d'accueil (ex: 500 élèves pour une école, 100 lits pour un hôpital)
    # La signification varie selon le type d'œuvre
    capacite = models.IntegerField(null=True, blank=True)

    # Description longue : historique, état, particularités
    description = models.TextField(blank=True)

    # Permet de marquer une œuvre comme inactive sans la supprimer de la base
    # (ex: terrain vendu, école fermée temporairement)
    est_active = models.BooleanField(default=True)

    # Horodatages automatiques gérés par Django
    created_at = models.DateTimeField(auto_now_add=True)  # rempli à la création
    updated_at = models.DateTimeField(auto_now=True)      # mis à jour à chaque sauvegarde

    class Meta:
        verbose_name = "Œuvre"
        verbose_name_plural = "Œuvres"
        # Tri hiérarchique : région → paroisse → nom de l'œuvre
        ordering = ["paroisse__district__region", "paroisse", "nom"]

    def __str__(self):
        # Ex: "École Primaire de Bonanjo (Scolaire) — PAROISSE DE BONANJO"
        return f"{self.nom} ({self.type_oeuvre}) — {self.paroisse.nom}"
