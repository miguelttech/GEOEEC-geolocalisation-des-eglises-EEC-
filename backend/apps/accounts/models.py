from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ("SUPER",    "Super Administrateur National"),
        ("REGION",   "Administrateur Régional"),
        ("DISTRICT", "Administrateur District"),
        ("PAROISSE", "Administrateur Paroissial"),
        ("VISITEUR", "Visiteur Authentifié"),
    ]

    role = models.CharField(max_length=10, choices=ROLES, default="PAROISSE")

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
