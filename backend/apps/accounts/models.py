from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ("SUPER",    "Administrateur Général"),
        ("REGION",   "Administrateur Régional"),
        ("DISTRICT", "Administrateur District"),
        ("PAROISSE", "Administrateur Paroissial"),
        ("VISITEUR", "Visiteur Authentifié"),
    ]

    role = models.CharField(max_length=10, choices=ROLES, default="PAROISSE")

    # Photo de profil (upload via /api/auth/me/avatar/) — validée/redimensionnée
    # à l'upload (voir auth_views.upload_avatar).
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    # Thème d'affichage persistant, restauré à chaque connexion.
    THEMES = [("clair", "Clair"), ("sombre", "Sombre")]
    theme = models.CharField(max_length=10, choices=THEMES, default="clair")

    # Portée géographique — null pour SUPER (accès global)
    region = models.ForeignKey(
        "geo.RegionSynodale",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="admins_region",
    )
    district = models.ForeignKey(
        "geo.District",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="admins_district",
    )
    paroisse = models.ForeignKey(
        "geo.Paroisse",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="admins_paroisse",
    )

    # Permissions granulaires optionnelles — ex: {"peut_supprimer_paroisse": True}
    permissions_custom = models.JSONField(default=dict, blank=True)

    telephone = models.CharField(max_length=20, blank=True, default="")
    force_password_change = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_super_admin(self):
        return self.role == "SUPER"

    @property
    def is_region_admin(self):
        return self.role == "REGION"

    @property
    def is_district_admin(self):
        return self.role == "DISTRICT"

    @property
    def is_paroisse_admin(self):
        return self.role == "PAROISSE"

    @property
    def is_visiteur(self):
        return self.role == "VISITEUR"

    @property
    def is_admin(self):
        """True pour tous les rôles administrateurs (excl. VISITEUR)."""
        return self.role in ("SUPER", "REGION", "DISTRICT", "PAROISSE")

    def has_custom_perm(self, perm_key):
        return bool(self.permissions_custom.get(perm_key, False))

    def get_scope_label(self):
        if self.role == "SUPER":
            return "National"
        if self.role == "REGION" and self.region:
            return f"Région {self.region.nom}"
        if self.role == "DISTRICT" and self.district:
            return f"District {self.district.nom}"
        if self.role == "PAROISSE" and self.paroisse:
            return self.paroisse.nom
        return "—"


class StatistiqueAnnuelle(models.Model):
    paroisse = models.ForeignKey(
        "geo.Paroisse",
        on_delete=models.CASCADE,
        related_name="statistiques",
    )
    annee = models.IntegerField()

    communiants = models.IntegerField(default=0)
    non_communiants = models.IntegerField(default=0)

    # Effectif total quand la source ne fournit PAS la ventilation.
    #
    # L'évaluation du Conseil Synodal (« Catégorisation paroisses EEC 050826 »)
    # ne donne qu'un effectif global par paroisse, là où l'enquête de terrain
    # 2025 distingue communiants et non-communiants. Répartir arbitrairement ce
    # total entre les deux colonnes fabriquerait une ventilation qui n'existe
    # pas ; le laisser dans `communiants` seul la fausserait tout autant.
    # D'où ce champ distinct : renseigné, il fait autorité sur la somme des
    # deux composantes (voir StatistiqueAnnuelleSerializer.get_total_fideles).
    total_declare = models.IntegerField(null=True, blank=True)

    baptemes = models.IntegerField(default=0)
    confirmations = models.IntegerField(default=0)
    mariages = models.IntegerField(default=0)
    deces = models.IntegerField(default=0)

    offrandes = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    dimes = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    validee = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Statistique Annuelle"
        verbose_name_plural = "Statistiques Annuelles"
        unique_together = ("paroisse", "annee")
        ordering = ["-annee", "paroisse"]

    def __str__(self):
        return f"{self.paroisse.nom} — {self.annee}"

    @property
    def total_fideles(self):
        return self.communiants + self.non_communiants

    @property
    def total_financier(self):
        return self.offrandes + self.dimes
