from django.contrib.gis.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

class BaseModel(models.Model):
    """Modèle de base avec des champs communs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='%(class)s_created'
    )
    
    class Meta:
        abstract = True

class Region(BaseModel):
    """Modèle pour les régions synodales"""
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    date_creation = models.DateField(default=timezone.now)
    
    class Meta:
        ordering = ['nom']
        verbose_name = 'Région Synodale'
        verbose_name_plural = 'Régions Synodales'
    
    def __str__(self):
        return self.nom
    
    @property
    def total_paroisses(self):
        return self.paroisses.count()
    
    @property
    def total_fideles(self):
        return sum(p.total_fideles for p in self.paroisses.all())

class District(BaseModel):
    """Modèle pour les districts"""
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='districts')
    description = models.TextField(blank=True)
    date_creation = models.DateField(default=timezone.now)
    
    class Meta:
        ordering = ['region__nom', 'nom']
        unique_together = ['nom', 'region']
        verbose_name = 'District'
        verbose_name_plural = 'Districts'
    
    def __str__(self):
        return f"{self.nom} ({self.region.nom})"

class Paroisse(BaseModel):
    """Modèle pour les paroisses"""
    NIVEAU_CHOICES = [
        ('paroisse', 'Paroisse'),
        ('station', 'Station'),
        ('annexe', 'Annexe'),
    ]
    
    nom = models.CharField(max_length=200)
    quartier = models.CharField(max_length=100, blank=True)
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='paroisse')
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='paroisses')
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='paroisses')
    
    # Statistiques des fidèles
    communiants = models.PositiveIntegerField(default=0)
    non_communiants = models.PositiveIntegerField(default=0)
    ouvriers = models.PositiveIntegerField(default=0)
    
    # Géolocalisation
    localisation = models.PointField(srid=4326, null=True, blank=True)
    adresse = models.TextField(blank=True)
    
    # Métadonnées
    date_creation = models.DateField(default=timezone.now)
    actif = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['region__nom', 'district__nom', 'nom']
        unique_together = ['nom', 'district']
        verbose_name = 'Paroisse'
        verbose_name_plural = 'Paroisses'
    
    def __str__(self):
        return f"{self.nom} ({self.district.nom})"
    
    @property
    def total_fideles(self):
        return (self.communiants or 0) + (self.non_communiants or 0)
    
    @property
    def pourcentage_communiants(self):
        total = self.total_fideles
        if total > 0:
            return round((self.communiants or 0) / total * 100, 1)
        return 0

class Grade(BaseModel):
    """Modèle pour les grades des ouvriers"""
    nom = models.CharField(max_length=100, unique=True)
    niveau = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['niveau', 'nom']
        verbose_name = 'Grade'
        verbose_name_plural = 'Grades'
    
    def __str__(self):
        return self.nom

class Ouvrier(BaseModel):
    """Modèle pour les ouvriers"""
    STATUT_CHOICES = [
        ('actif', 'Actif'),
        ('retraite', 'Retraité'),
        ('suspendu', 'Suspendu'),
        ('decede', 'Décédé'),
    ]
    
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='ouvriers')
    paroisse = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='ouvriers_detail')
    
    # Informations personnelles
    date_naissance = models.DateField(null=True, blank=True)
    date_ordination = models.DateField(default=timezone.now)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='actif')
    
    # Contact
    telephone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Géolocalisation
    localisation = models.PointField(srid=4326, null=True, blank=True)
    adresse = models.TextField(blank=True)
    
    class Meta:
        ordering = ['grade__niveau', 'nom', 'prenom']
        verbose_name = 'Ouvrier'
        verbose_name_plural = 'Ouvriers'
    
    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.grade.nom})"
    
    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

class TypeOeuvre(BaseModel):
    """Modèle pour les types d'œuvres"""
    nom = models.CharField(max_length=100, unique=True)
    icone = models.CharField(max_length=50, blank=True)
    couleur = models.CharField(max_length=7, default='#007bff')
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['nom']
        verbose_name = 'Type d\'Œuvre'
        verbose_name_plural = 'Types d\'Œuvres'
    
    def __str__(self):
        return self.nom

class Oeuvre(BaseModel):
    """Modèle pour les œuvres"""
    NIVEAU_CHOICES = [
        ('paroissial', 'Paroissial'),
        ('district', 'District'),
        ('regional', 'Régional'),
        ('national', 'National'),
    ]
    
    STATUT_CHOICES = [
        ('active', 'Active'),
        ('en_construction', 'En Construction'),
        ('suspendue', 'Suspendue'),
        ('fermee', 'Fermée'),
    ]
    
    nom = models.CharField(max_length=200)
    type_oeuvre = models.ForeignKey(TypeOeuvre, on_delete=models.CASCADE, related_name='oeuvres')
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='paroissial')
    paroisse = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='oeuvres')
    
    # Détails
    description = models.TextField(blank=True)
    capacite = models.PositiveIntegerField(null=True, blank=True)
    budget_annuel = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='active')
    
    # Géolocalisation
    localisation = models.PointField(srid=4326, null=True, blank=True)
    adresse = models.TextField(blank=True)
    
    # Dates
    date_creation = models.DateField(default=timezone.now)
    date_inauguration = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['type_oeuvre__nom', 'nom']
        verbose_name = 'Œuvre'
        verbose_name_plural = 'Œuvres'
    
    def __str__(self):
        return f"{self.nom} ({self.type_oeuvre.nom})"

class StatistiqueAnnuelle(BaseModel):
    """Modèle pour les statistiques annuelles des paroisses"""
    paroisse = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='statistiques')
    annee = models.PositiveIntegerField()
    
    # Statistiques des fidèles
    communiants = models.PositiveIntegerField(default=0)
    non_communiants = models.PositiveIntegerField(default=0)
    
    # Événements
    baptemes = models.PositiveIntegerField(default=0)
    confirmations = models.PositiveIntegerField(default=0)
    mariages = models.PositiveIntegerField(default=0)
    deces = models.PositiveIntegerField(default=0)
    
    # Finances
    offrandes = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    dimes = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Métadonnées
    validee = models.BooleanField(default=False)
    date_saisie = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-annee', 'paroisse__nom']
        unique_together = ['paroisse', 'annee']
        verbose_name = 'Statistique Annuelle'
        verbose_name_plural = 'Statistiques Annuelles'
    
    def __str__(self):
        return f"{self.paroisse.nom} - {self.annee}"
    
    @property
    def total_fideles(self):
        return self.communiants + self.non_communiants

class ZoneInfluence(BaseModel):
    """Modèle pour les zones d'influence des paroisses"""
    nom = models.CharField(max_length=200, blank=True)
    paroisse = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='zones_influence')
    geometrie = models.PolygonField(srid=4326)
    rayon_km = models.FloatField(validators=[MinValueValidator(0.1), MaxValueValidator(100)])
    population_estimee = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['paroisse__nom']
        verbose_name = 'Zone d\'Influence'
        verbose_name_plural = 'Zones d\'Influence'
    
    def __str__(self):
        return f"Zone {self.paroisse.nom} ({self.rayon_km}km)"

class Itineraire(BaseModel):
    """Modèle pour les itinéraires entre paroisses"""
    TRANSPORT_CHOICES = [
        ('pied', 'À pied'),
        ('velo', 'Vélo'),
        ('moto', 'Moto'),
        ('voiture', 'Voiture'),
        ('transport_public', 'Transport Public'),
    ]
    
    DIFFICULTE_CHOICES = [
        ('facile', 'Facile'),
        ('moyen', 'Moyen'),
        ('difficile', 'Difficile'),
    ]
    
    nom = models.CharField(max_length=200, blank=True)
    paroisse_depart = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='itineraires_depart')
    paroisse_arrivee = models.ForeignKey(Paroisse, on_delete=models.CASCADE, related_name='itineraires_arrivee')
    geometrie = models.LineStringField(srid=4326)
    distance_km = models.FloatField()
    duree_minutes = models.PositiveIntegerField(null=True, blank=True)
    type_transport = models.CharField(max_length=20, choices=TRANSPORT_CHOICES, default='voiture')
    difficulte = models.CharField(max_length=20, choices=DIFFICULTE_CHOICES, default='moyen')
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['paroisse_depart__nom', 'paroisse_arrivee__nom']
        unique_together = ['paroisse_depart', 'paroisse_arrivee', 'type_transport']
        verbose_name = 'Itinéraire'
        verbose_name_plural = 'Itinéraires'
    
    def __str__(self):
        return f"{self.paroisse_depart.nom} → {self.paroisse_arrivee.nom}"

class HistoriquePosition(BaseModel):
    """Modèle pour l'historique des changements de position"""
    TYPE_OBJET_CHOICES = [
        ('paroisse', 'Paroisse'),
        ('oeuvre', 'Œuvre'),
        ('ouvrier', 'Ouvrier'),
    ]
    
    type_objet = models.CharField(max_length=20, choices=TYPE_OBJET_CHOICES)
    objet_id = models.UUIDField()
    ancienne_position = models.PointField(srid=4326, null=True, blank=True)
    nouvelle_position = models.PointField(srid=4326)
    raison_changement = models.TextField()
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='historique_positions'
    )
    date_changement = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_changement']
        verbose_name = 'Historique Position'
        verbose_name_plural = 'Historiques Positions'
    
    def __str__(self):
        return f"{self.type_objet} {self.objet_id} - {self.date_changement}"
