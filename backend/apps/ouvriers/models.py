"""
=============================================================================
FICHIER : apps/ouvriers/models.py
RÔLE    : Modèles pour les Ouvriers de l'EEC

Un "ouvrier" dans le vocabulaire EEC désigne tout agent de l'église :
pasteurs, évêques, diacres, catéchistes, secrétaires, etc.

Ce fichier définit :
  - Grade   : le rang ecclésiastique d'un ouvrier (Évêque, Pasteur, Diacre...)
  - Ouvrier : la personne elle-même, avec son grade, sa paroisse et sa position GPS

Les données viennent du fichier Excel 'OUVRIERS.xlsx' (708 ouvriers).

DÉPENDANCES :
  - django.contrib.gis.db → PointField pour les coordonnées GPS de l'ouvrier
  - apps.geo.models.Paroisse → chaque ouvrier est affecté à une paroisse
=============================================================================
"""

# Import géographique pour PointField (localisation GPS de l'ouvrier)
from django.contrib.gis.db import models

# Chaque ouvrier est rattaché à une paroisse
from apps.geo.models import Paroisse


# =============================================================================
# MODÈLE 1 : Grade
# =============================================================================
class Grade(models.Model):
    """
    Rang ecclésiastique d'un ouvrier dans la hiérarchie de l'EEC.

    L'EEC a une structure hiérarchique précise. Exemples de grades :
      Niveau 1 (plus haut) : Évêque (Ev.)
      Niveau 2             : Ancien Évêque (A.Ev.)
      Niveau 3             : Pasteur Principal (P.P.)
      Niveau 4             : Pasteur (P.)
      Niveau 5             : Diacre (D.)
      Niveau 6             : Catéchiste (Cat.)
      ...

    Le champ 'niveau' permet de trier les grades du plus haut au plus bas.
    Le champ 'abreviation' est utilisé sur les cartes et dans les listes compactes.
    """

    # Nom complet du grade (ex: "Évêque", "Pasteur Principal", "Diacre")
    # unique=True : pas deux grades avec le même nom
    nom = models.CharField(max_length=100, unique=True)

    # Niveau hiérarchique : 1 = plus haut grade, nombre plus grand = grade inférieur
    # Permet de trier par ordre hiérarchique (ORDER BY niveau)
    niveau = models.IntegerField()

    # Abréviation utilisée sur les cartes et listes (ex: "Ev.", "P.", "D.", "Cat.")
    abreviation = models.CharField(max_length=10, blank=True)

    class Meta:
        verbose_name = "Grade"
        verbose_name_plural = "Grades"
        # Tri du grade le plus élevé (niveau 1) vers le plus bas
        ordering = ["niveau"]

    def __str__(self):
        # Ex: "Ev. — Évêque"
        return f"{self.abreviation} — {self.nom}"


# =============================================================================
# MODÈLE 2 : Ouvrier
# =============================================================================
class Ouvrier(models.Model):
    """
    Représente un ouvrier (agent pastoral) de l'EEC.

    Chaque ouvrier est :
      - Affecté à une paroisse (son lieu de mission principal)
      - Classé par un grade (son rang dans la hiérarchie)
      - Optionnellement géolocalisé par des coordonnées GPS

    Les données viennent du fichier Excel 'OUVRIERS.xlsx' (708 ouvriers).

    Note : la position GPS d'un ouvrier est son lieu de résidence ou de travail,
    pas forcément la position exacte de sa paroisse.
    """

    # Choix du sexe (M ou F)
    SEXE = [
        ("M", "Masculin"),
        ("F", "Féminin"),
    ]

    # Statut actuel de l'ouvrier dans le service de l'EEC
    # EXIGENCE : seuls deux états existent pour un ouvrier.
    # OCCUPE   = affecté et en service dans sa paroisse
    # INOCCUPE = retiré / disponible (préalable obligatoire à toute réaffectation)
    STATUT = [
        ("OCCUPE", "Occupé"),
        ("INOCCUPE", "Inoccupé"),
    ]

    # Identité de l'ouvrier
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=SEXE, default="M")

    # Grade ecclésiastique de l'ouvrier (optionnel : peut être inconnu à l'import)
    # null=True : un ouvrier sans grade connu peut quand même être importé
    # related_name="ouvriers" : grade.ouvriers.all() → tous les ouvriers de ce grade
    grade = models.ForeignKey(
        Grade,
        on_delete=models.PROTECT,   # ne pas supprimer un grade qui a des ouvriers
        related_name="ouvriers",
        null=True,
        blank=True,
    )

    # Paroisse où l'ouvrier est affecté (son poste d'assignation)
    # PROTECT : on ne supprime pas une paroisse si elle a des ouvriers
    # related_name="ouvriers" : paroisse.ouvriers.all() → tous les ouvriers de la paroisse
    paroisse = models.ForeignKey(
        Paroisse, on_delete=models.PROTECT, related_name="ouvriers"
    )

    # EXIGENCE : un ouvrier n'est JAMAIS géolocalisable — l'ancien champ
    # `position` (PointField) a été supprimé. Seule son AFFECTATION
    # (la paroisse, unique) le situe géographiquement.

    # Coordonnées de contact
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)

    # Dates importantes dans la carrière de l'ouvrier
    date_naissance = models.DateField(null=True, blank=True)
    date_ordination = models.DateField(null=True, blank=True)  # date d'entrée en service

    # État actuel dans le service
    statut = models.CharField(max_length=10, choices=STATUT, default="OCCUPE")

    # Horodatages automatiques
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ouvrier"
        verbose_name_plural = "Ouvriers"
        # Tri alphabétique : nom puis prénom
        ordering = ["nom", "prenom"]

    def __str__(self):
        # Affiche l'abréviation du grade si disponible (ex: "P. MBELE Jean")
        grade_str = f"{self.grade.abreviation} " if self.grade else ""
        return f"{grade_str}{self.nom} {self.prenom}"
