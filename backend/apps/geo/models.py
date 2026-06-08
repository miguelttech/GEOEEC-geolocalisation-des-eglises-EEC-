"""
=============================================================================
FICHIER : apps/geo/models.py
RÔLE    : Modèles géographiques de la plateforme EEC Géolocalisation

Ce fichier définit toutes les entités géographiques de l'EEC :
  - RegionSynodale  : les 22 grandes zones administratives de l'EEC (polygones)
  - District        : les 134 subdivisions d'une région (polygones)
  - Paroisse        : les 693 lieux de culte avec coordonnées GPS (points)
  - ZoneInfluence   : la zone géographique couverte par une paroisse (polygone)
  - Itineraire      : le chemin entre deux paroisses (ligne)
  - HistoriquePosition : trace chaque changement de coordonnées GPS d'une entité

DÉPENDANCES :
  - django.contrib.gis.db  → fournit les champs géographiques (PointField, etc.)
  - django.conf.settings   → pour référencer le modèle User de façon générique

TYPES DE GÉOMÉTRIE UTILISÉS (système de coordonnées : EPSG:4326 = WGS84 = GPS standard) :
  - MultiPolygonField → plusieurs polygones fusionnés (régions, districts)
  - PointField        → un point GPS (latitude, longitude)
  - PolygonField      → un seul polygone fermé (zone d'influence)
  - LineStringField   → une ligne (itinéraire entre deux points)
=============================================================================
"""

# On importe 'models' depuis 'gis' et non pas depuis 'django.db' classique.
# La version GIS de models fournit les types de champs géographiques spéciaux
# comme PointField, MultiPolygonField, etc. — absents du models standard.
from django.contrib.gis.db import models

# settings.AUTH_USER_MODEL permet de référencer le modèle User de l'app accounts
# sans faire un import direct (évite les dépendances circulaires entre apps)
from django.conf import settings


# =============================================================================
# MODÈLE 1 : RegionSynodale
# =============================================================================
class RegionSynodale(models.Model):
    """
    Représente une Région Synodale de l'EEC.

    L'EEC est divisée en 22 régions synodales (ex: LITTORAL, CENTRE, NORD...).
    Chaque région regroupe plusieurs districts, qui eux-mêmes regroupent des paroisses.
    La géométrie (frontières) vient du shapefile 'Region_synodale_ok2.shp'.

    ATTENTION : 5 noms de régions dans le shapefile ne correspondent pas exactement
    aux noms dans l'Excel. Une table de correspondance est utilisée lors de l'import.
    Ex : "HAUT-NKAM" (shapefile) ↔ "HAUT NKAM" (Excel)
    """

    # Nom officiel de la région (ex: "LITTORAL", "CENTRE SUD ET ILE")
    # unique=True : deux régions ne peuvent pas avoir le même nom
    nom = models.CharField(max_length=100, unique=True)

    # Code court optionnel pour identifier la région (ex: "LIT", "CSI")
    # null=True + blank=True : ce champ n'est pas obligatoire
    code = models.CharField(max_length=10, unique=True, null=True, blank=True)

    # Géométrie géographique : MultiPolygon car une région peut avoir plusieurs
    # zones non contiguës (ex : une région + une île). Stockée en WGS84 (GPS standard).
    # null=True : certaines régions peuvent être importées sans géométrie au début
    geometrie = models.MultiPolygonField(srid=4326, null=True, blank=True)

    # Population estimée de la région (données démographiques optionnelles)
    population_estimee = models.IntegerField(null=True, blank=True)

    # Date de création de la région synodale (historique de l'église)
    date_creation = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Région Synodale"
        verbose_name_plural = "Régions Synodales"
        # Tri alphabétique par défaut dans l'admin Django et les APIs
        ordering = ["nom"]

    def __str__(self):
        # Représentation textuelle : affichée dans l'admin Django
        return self.nom


# =============================================================================
# MODÈLE 2 : District
# =============================================================================
class District(models.Model):
    """
    Représente un District de l'EEC.

    Un district est une subdivision d'une région synodale.
    L'EEC compte 134 districts au total.
    Chaque district appartient à exactement une région (ForeignKey vers RegionSynodale).
    """

    # Nom du district (ex: "WOURI", "MFOUNDI", "DIAMARÉ")
    nom = models.CharField(max_length=150)

    # Code court optionnel du district
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)

    # Lien vers la région parente.
    # on_delete=PROTECT : on ne peut PAS supprimer une région si elle a des districts
    # related_name="districts" : depuis un objet RegionSynodale, on peut écrire
    #   region.districts.all() pour obtenir tous ses districts
    region = models.ForeignKey(
        RegionSynodale, on_delete=models.PROTECT, related_name="districts"
    )

    # Frontières géographiques du district (MultiPolygon, optionnel)
    geometrie = models.MultiPolygonField(srid=4326, null=True, blank=True)

    class Meta:
        verbose_name = "District"
        verbose_name_plural = "Districts"
        # Tri : d'abord par région, puis par nom de district à l'intérieur
        ordering = ["region", "nom"]

    def __str__(self):
        # Affiche "WOURI (LITTORAL)" pour faciliter l'identification
        return f"{self.nom} ({self.region.nom})"


# =============================================================================
# MODÈLE 3 : Paroisse
# =============================================================================
class Paroisse(models.Model):
    """
    Représente une Paroisse de l'EEC — entité centrale du projet.

    C'est l'entité la plus importante : 693 paroisses sont à géolocaliser.
    Parmi elles, 255 n'ont pas encore de coordonnées GPS (position = null).
    Les données viennent du fichier Excel 'Recap_paroisses_Projet_de_géolocalisation_26mai.xlsx'.

    PIÈGE CRITIQUE dans les données sources :
      - Colonne "Coord_x" dans l'Excel = LATITUDE  (et non longitude !)
      - Colonne "Coord_y" dans l'Excel = LONGITUDE (et non latitude !)
      Les colonnes sont inversées par rapport à la convention standard OGC.
      Lors de l'import, on corrige : Point(Coord_y, Coord_x, srid=4326)
                                            ↑longitude   ↑latitude
    """

    NIVEAUX = [
        ("PAROISSE", "Paroisse"),
        ("STATION", "Station"),
        ("ANNEXE", "Annexe"),
    ]

    # Nom de la paroisse (ex: "PAROISSE DE BONANJO", "PAROISSE CENTRALE DE YAOUNDÉ")
    nom = models.CharField(max_length=200)

    # Code unique optionnel (ex: "PAR-001")
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)

    # Niveau hiérarchique : Paroisse > Station > Annexe
    niveau = models.CharField(max_length=10, choices=NIVEAUX, default="PAROISSE")

    # District auquel appartient cette paroisse
    # on_delete=PROTECT : on ne peut pas supprimer un district avec des paroisses
    # related_name="paroisses" : district.paroisses.all() → toutes les paroisses du district
    district = models.ForeignKey(
        District, on_delete=models.PROTECT, related_name="paroisses"
    )

    # Coordonnées GPS de la paroisse (point = longitude + latitude)
    # null=True : 255 paroisses n'ont pas encore de GPS → valeur nulle acceptée
    # RAPPEL : on stocke Point(longitude, latitude) — ordre standard GIS
    position = models.PointField(srid=4326, null=True, blank=True)

    # Informations de contact
    adresse = models.TextField(blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)

    # Année de fondation de la paroisse
    annee_creation = models.IntegerField(null=True, blank=True)

    # Permet de désactiver une paroisse sans la supprimer (soft delete)
    est_active = models.BooleanField(default=True)

    # Effectif déclaré des fidèles (peut être mis à jour via StatistiqueAnnuelle)
    nombre_fideles = models.IntegerField(null=True, blank=True)

    # Horodatage automatique : Django remplit ces champs automatiquement
    created_at = models.DateTimeField(auto_now_add=True)  # date de création en base
    updated_at = models.DateTimeField(auto_now=True)      # date de dernière modification

    class Meta:
        verbose_name = "Paroisse"
        verbose_name_plural = "Paroisses"
        # Tri hiérarchique : région → district → paroisse (ordre logique pour les listes)
        ordering = ["district__region", "district", "nom"]

    def __str__(self):
        return f"{self.nom} — {self.district.nom}"


# =============================================================================
# MODÈLE 4 : ZoneInfluence
# =============================================================================
class ZoneInfluence(models.Model):
    """
    Représente la zone géographique d'influence d'une paroisse.

    C'est le territoire qu'une paroisse dessert spirituellement.
    Chaque paroisse peut avoir UNE SEULE zone (OneToOneField).
    Contrairement aux régions/districts (MultiPolygon), c'est un simple Polygon
    car la zone est continue et n'a pas de trous.

    Cette zone peut être calculée automatiquement (rayon_km depuis le centre GPS)
    ou dessinée manuellement sur la carte.
    """

    # Lien 1-à-1 vers la paroisse (une paroisse = une zone, pas plus)
    # CASCADE : si la paroisse est supprimée, sa zone est supprimée aussi
    paroisse = models.OneToOneField(
        Paroisse, on_delete=models.CASCADE, related_name="zone_influence"
    )

    # Périmètre de la zone sur la carte (Polygon = forme fermée continue)
    geometrie = models.PolygonField(srid=4326)

    # Rayon en kilomètres si la zone est un cercle calculé depuis le GPS
    rayon_km = models.FloatField(null=True, blank=True)

    # Estimation de la population vivant dans cette zone (optionnel)
    population_estimee = models.IntegerField(null=True, blank=True)

    # Notes supplémentaires sur la zone
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Zone d'Influence"
        verbose_name_plural = "Zones d'Influence"

    def __str__(self):
        return f"Zone — {self.paroisse.nom}"


# =============================================================================
# MODÈLE 5 : Itineraire
# =============================================================================
class Itineraire(models.Model):
    """
    Représente le trajet entre deux paroisses.

    Utile pour planifier des visites pastorales ou des missions.
    La géométrie est une LineString = une ligne avec des points intermédiaires
    (le tracé réel de la route sur la carte).

    Deux paroisses ne peuvent avoir qu'un seul itinéraire entre elles
    (unique_together dans Meta).
    """

    # Types de transport possibles entre deux paroisses
    TYPE_TRANSPORT = [
        ("ROUTE", "Route"),
        ("PISTE", "Piste"),       # route non goudronnée, terrain difficile
        ("FLUVIAL", "Voie fluviale"),
        ("MIXTE", "Mixte"),       # combinaison de plusieurs moyens
    ]

    # Niveau de difficulté du trajet (utile pour les missions en zone rurale)
    DIFFICULTE = [
        ("FACILE", "Facile"),
        ("MOYEN", "Moyen"),
        ("DIFFICILE", "Difficile"),
    ]

    # Paroisse de départ du trajet
    # related_name="itineraires_depart" : paroisse.itineraires_depart.all()
    paroisse_depart = models.ForeignKey(
        Paroisse, on_delete=models.CASCADE, related_name="itineraires_depart"
    )

    # Paroisse d'arrivée du trajet
    # related_name="itineraires_arrivee" : paroisse.itineraires_arrivee.all()
    paroisse_arrivee = models.ForeignKey(
        Paroisse, on_delete=models.CASCADE, related_name="itineraires_arrivee"
    )

    # Tracé réel du trajet sur la carte (optionnel, peut être calculé plus tard)
    geometrie = models.LineStringField(srid=4326, null=True, blank=True)

    # Distance calculée en kilomètres
    distance_km = models.FloatField(null=True, blank=True)

    # Durée estimée en minutes pour effectuer le trajet
    duree_minutes = models.IntegerField(null=True, blank=True)

    # Moyen de transport principal utilisé
    type_transport = models.CharField(
        max_length=10, choices=TYPE_TRANSPORT, default="ROUTE"
    )

    # Niveau de difficulté du trajet
    difficulte = models.CharField(
        max_length=10, choices=DIFFICULTE, default="MOYEN"
    )

    # Notes supplémentaires (ex: "traversée de rivière à gué en saison des pluies")
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Itinéraire"
        verbose_name_plural = "Itinéraires"
        # Un seul itinéraire possible entre deux paroisses (dans un sens)
        unique_together = ("paroisse_depart", "paroisse_arrivee")

    def __str__(self):
        return f"{self.paroisse_depart.nom} → {self.paroisse_arrivee.nom}"


# =============================================================================
# MODÈLE 6 : HistoriquePosition
# =============================================================================
class HistoriquePosition(models.Model):
    """
    Trace chaque changement de coordonnées GPS d'une entité (paroisse, ouvrier, oeuvre).

    Pourquoi c'est important :
      - Une paroisse peut déménager dans un nouveau bâtiment
      - Un ouvrier peut être muté dans une autre zone
      - On doit garder la trace de ces mouvements pour l'audit

    Ce modèle utilise une relation générique (type_objet + objet_id) au lieu d'une
    ForeignKey directe, car on veut pouvoir tracker 3 types d'entités différentes
    avec un seul modèle.
    """

    # Type de l'entité dont on trace le mouvement
    TYPE_OBJET = [
        ("paroisse", "Paroisse"),
        ("ouvrier", "Ouvrier"),
        ("oeuvre", "Œuvre"),
    ]

    # Type de l'entité concernée ("paroisse", "ouvrier" ou "oeuvre")
    type_objet = models.CharField(max_length=20, choices=TYPE_OBJET)

    # Identifiant (clé primaire) de l'entité concernée dans sa propre table
    # Ex: si type_objet="paroisse" et objet_id=42 → c'est la Paroisse avec id=42
    objet_id = models.IntegerField()

    # Ancienne position GPS avant le déplacement (null si c'est le premier enregistrement)
    ancienne_position = models.PointField(srid=4326, null=True, blank=True)

    # Nouvelle position GPS après le déplacement
    nouvelle_position = models.PointField(srid=4326)

    # Explication du changement (ex: "construction d'un nouveau bâtiment", "mutation pastorale")
    raison_changement = models.TextField(blank=True)

    # Administrateur qui a effectué le changement (piste d'audit)
    # SET_NULL : si l'utilisateur est supprimé, l'historique est conservé (objet_id = null)
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,    # = apps.accounts.User (défini dans settings.py)
        on_delete=models.SET_NULL,
        null=True,
        related_name="historiques_position",
    )

    # Date et heure du changement, remplie automatiquement par Django
    date_changement = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Historique de Position"
        verbose_name_plural = "Historiques de Position"
        # Les plus récents d'abord dans les listes
        ordering = ["-date_changement"]

    def __str__(self):
        # Ex: "paroisse #42 — 15/05/2026"
        return f"{self.type_objet} #{self.objet_id} — {self.date_changement:%d/%m/%Y}"
