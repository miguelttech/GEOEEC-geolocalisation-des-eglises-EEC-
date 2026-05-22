"""
=============================================================================
FICHIER : apps/accounts/models.py
RÔLE    : Modèles utilisateurs et statistiques annuelles

Ce fichier définit :
  1. User              : le modèle utilisateur personnalisé avec 4 rôles RBAC
  2. StatistiqueAnnuelle : les chiffres annuels par paroisse (baptêmes, mariages, etc.)

ACCÈS À LA PLATEFORME — deux catégories :
  - Visiteurs (public anonyme) : accèdent à la carte en lecture seule, SANS compte
  - Administrateurs (4 rôles) : ont un compte et peuvent modifier les données

LES 4 RÔLES ADMINISTRATEURS :
  ┌─────────────────┬──────────────────────────────────────────────────────┐
  │ SUPER           │ Voit et modifie tout (Direction Nationale EEC)        │
  │ REGION          │ Voit et modifie sa région synodale uniquement         │
  │ DISTRICT        │ Voit et modifie son district uniquement               │
  │ PAROISSE        │ Voit et modifie sa paroisse uniquement                │
  └─────────────────┴──────────────────────────────────────────────────────┘

AUTH : Sessions Django (cookie HttpOnly) — PAS de JWT.
       Le cookie de session est sécurisé (HttpOnly + Secure + SameSite=Strict).

DÉPENDANCES :
  - AbstractUser → classe de base Django pour les utilisateurs personnalisés
  - "geo.Paroisse" → référence en chaîne pour éviter les imports circulaires
=============================================================================
"""

# AbstractUser : classe Django qui fournit déjà username, password, email,
# first_name, last_name, is_active, is_staff, date_joined, etc.
# On l'étend en ajoutant uniquement le champ 'role'.
from django.contrib.auth.models import AbstractUser

# models standard Django (pas gis ici, car User n'a pas de coordonnées GPS)
from django.db import models


# =============================================================================
# MODÈLE 1 : User
# =============================================================================
class User(AbstractUser):
    """
    Modèle utilisateur personnalisé de la plateforme EEC.

    On hérite de AbstractUser pour bénéficier de toute la gestion d'auth Django
    (login, logout, sessions, hash mot de passe) et on ajoute juste le rôle.

    Ce modèle est référencé dans settings.py via AUTH_USER_MODEL = "accounts.User".
    Tous les autres modèles qui ont besoin d'un lien vers l'utilisateur utilisent
    settings.AUTH_USER_MODEL au lieu d'importer directement ce modèle.

    SEULS les administrateurs ont un compte. Les visiteurs publics n'ont pas
    de compte et accèdent à la carte en mode lecture seule sans authentification.
    """

    # Les 4 rôles possibles pour un administrateur
    # La restriction des données (filtrage par région/district/paroisse)
    # sera appliquée dans les vues et les permissions DRF, pas dans ce modèle.
    ROLES = [
        ("SUPER",    "Super Administrateur National"),  # accès total
        ("REGION",   "Administrateur Régional"),        # sa région seulement
        ("DISTRICT", "Administrateur District"),        # son district seulement
        ("PAROISSE", "Administrateur Paroissial"),      # sa paroisse seulement
    ]

    # Rôle de cet utilisateur — détermine ce qu'il peut voir et modifier
    # default="PAROISSE" : le niveau d'accès le plus restreint par défaut (principe du moindre privilège)
    role = models.CharField(max_length=10, choices=ROLES, default="PAROISSE")

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        # Ex: "Jean MBELE (Administrateur Régional)"
        return f"{self.get_full_name()} ({self.get_role_display()})"

    # Propriétés utiles pour vérifier le rôle sans comparer des chaînes manuellement
    @property
    def is_super_admin(self):
        """Retourne True si cet utilisateur est Super Administrateur National."""
        return self.role == "SUPER"

    @property
    def is_region_admin(self):
        """Retourne True si cet utilisateur est Administrateur Régional."""
        return self.role == "REGION"


# =============================================================================
# MODÈLE 2 : StatistiqueAnnuelle
# =============================================================================
class StatistiqueAnnuelle(models.Model):
    """
    Statistiques annuelles d'une paroisse — chiffres de vie ecclésiastique.

    Chaque paroisse remplit ces statistiques une fois par an.
    Elles regroupent les actes liturgiques et les données financières.

    Une seule statistique par paroisse par année (unique_together).
    Les statistiques doivent être validées par un supérieur avant d'être
    intégrées aux rapports officiels (champ 'validee').

    Le lien vers Paroisse est écrit en chaîne ("geo.Paroisse") pour éviter
    un import circulaire (accounts → geo → accounts serait un cycle).
    En écrivant "geo.Paroisse", Django résout la référence au démarrage.
    """

    # Paroisse concernée par ces statistiques
    # Note : on utilise la notation en chaîne "geo.Paroisse" (et non l'import direct)
    # pour éviter les dépendances circulaires entre les apps Django
    paroisse = models.ForeignKey(
        "geo.Paroisse",
        on_delete=models.CASCADE,       # si la paroisse est supprimée, ses stats aussi
        related_name="statistiques",    # paroisse.statistiques.all() → toutes ses stats
    )

    # Année de référence de ces statistiques (ex: 2025, 2024...)
    annee = models.IntegerField()

    # === DONNÉES DÉMOGRAPHIQUES ===
    # Membres adultes qui ont reçu la communion (confirmés)
    communiants = models.IntegerField(default=0)

    # Membres (enfants et catéchumènes) qui n'ont pas encore communié
    non_communiants = models.IntegerField(default=0)

    # === ACTES LITURGIQUES ANNUELS ===
    # Nombre de personnes baptisées dans l'année
    baptemes = models.IntegerField(default=0)

    # Nombre de personnes confirmées dans l'année
    confirmations = models.IntegerField(default=0)

    # Nombre de mariages célébrés dans la paroisse
    mariages = models.IntegerField(default=0)

    # Nombre de décès enregistrés dans la paroisse
    deces = models.IntegerField(default=0)

    # === DONNÉES FINANCIÈRES (en FCFA) ===
    # Total des offrandes collectées dans l'année
    # DecimalField avec 12 chiffres max et 2 décimales (ex: 1 500 000.00 FCFA)
    offrandes = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Total des dîmes perçues dans l'année
    dimes = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Indique si ces statistiques ont été vérifiées et approuvées par un supérieur
    # False = en attente de validation, True = validées et utilisables dans les rapports
    validee = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Statistique Annuelle"
        verbose_name_plural = "Statistiques Annuelles"
        # Une seule ligne de stats par paroisse par année
        unique_together = ("paroisse", "annee")
        # Affichage : année décroissante (les plus récentes d'abord), puis par paroisse
        ordering = ["-annee", "paroisse"]

    def __str__(self):
        # Ex: "PAROISSE DE BONANJO — 2025"
        return f"{self.paroisse.nom} — {self.annee}"

    @property
    def total_fideles(self):
        """Calcule le total des fidèles (communiants + non communiants)."""
        return self.communiants + self.non_communiants

    @property
    def total_financier(self):
        """Calcule le total des recettes (offrandes + dîmes) en FCFA."""
        return self.offrandes + self.dimes
