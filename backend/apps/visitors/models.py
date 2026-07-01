from django.db import models
from django.conf import settings


class ProfilVisiteur(models.Model):
    """
    Données de préférence d'un visiteur authentifié.
    Créé automatiquement à l'inscription (signal post_save sur User).
    """
    LANGUES = [("fr", "Français"), ("en", "English")]

    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil_visiteur",
    )
    langue = models.CharField(max_length=5, choices=LANGUES, default="fr")

    # Paroisse à laquelle le visiteur est affilié (sa propre église)
    paroisse_affiliee = models.ForeignKey(
        "geo.Paroisse",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="membres_affilies",
    )
    # Région préférée pour les recherches par défaut
    region_preferee = models.ForeignKey(
        "geo.RegionSynodale",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="visiteurs_preferes",
    )
    notifications_email = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil Visiteur"
        verbose_name_plural = "Profils Visiteurs"

    def __str__(self):
        return f"Profil de {self.utilisateur.get_full_name() or self.utilisateur.email}"


class ParoisseVue(models.Model):
    """
    Trace chaque consultation d'une paroisse par un visiteur authentifié.
    Table centrale pour les analytics : top paroisses, courbes d'activité.
    Les visiteurs anonymes ne sont PAS tracés.
    """
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paroisses_vues",
    )
    paroisse = models.ForeignKey(
        "geo.Paroisse",
        on_delete=models.CASCADE,
        related_name="vues_visiteurs",
    )
    vue_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Paroisse Vue"
        verbose_name_plural = "Paroisses Vues"
        # Index pour accélérer les requêtes analytics
        indexes = [
            models.Index(fields=["paroisse", "vue_at"]),
            models.Index(fields=["utilisateur", "vue_at"]),
        ]

    def __str__(self):
        return f"{self.utilisateur.email} → {self.paroisse.nom} ({self.vue_at:%d/%m/%Y})"


class RechercheHistorique(models.Model):
    """
    Historique des recherches effectuées par un visiteur authentifié.
    Sert aussi aux analytics : tendances de recherche, filtres les plus utilisés.
    """
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recherches",
    )
    # Texte de la recherche libre (ex: "paroisse centrale yaoundé")
    query = models.CharField(max_length=300, blank=True)
    # Filtres actifs au moment de la recherche
    # ex: {"region": "LITTORAL", "type_oeuvre": "scolaire", "grade": "pasteur", "has_gps": true}
    filtres = models.JSONField(default=dict, blank=True)
    # Nombre de résultats retournés
    resultats_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Recherche Historique"
        verbose_name_plural = "Recherches Historiques"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["utilisateur", "created_at"]),
        ]

    def __str__(self):
        return f"{self.utilisateur.email} : \"{self.query}\" ({self.created_at:%d/%m/%Y})"


class ItinerairePersonnel(models.Model):
    """
    Itinéraire calculé par un visiteur authentifié entre deux points.
    Distinct du modèle Itineraire admin (routes officielles entre paroisses).
    Ici : calcul à la demande d'un utilisateur, avec position GPS libre possible.
    """
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="itineraires_personnels",
    )

    # Départ : soit une paroisse connue, soit une position GPS libre (géolocalisation)
    depart_paroisse = models.ForeignKey(
        "geo.Paroisse",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="itineraires_comme_depart",
    )
    # Coordonnées GPS si le départ est la position actuelle du visiteur
    depart_lat = models.FloatField(null=True, blank=True)
    depart_lng = models.FloatField(null=True, blank=True)

    # Destination : toujours une paroisse
    arrivee_paroisse = models.ForeignKey(
        "geo.Paroisse",
        on_delete=models.CASCADE,
        related_name="itineraires_comme_arrivee",
    )

    # Résultats du calcul (remplis après le calcul, null si calcul échoué)
    distance_km = models.FloatField(null=True, blank=True)
    duree_minutes = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Itinéraire Personnel"
        verbose_name_plural = "Itinéraires Personnels"
        ordering = ["-created_at"]

    def __str__(self):
        depart = self.depart_paroisse.nom if self.depart_paroisse else "Position GPS"
        return f"{self.utilisateur.email} : {depart} → {self.arrivee_paroisse.nom}"


class ParoisseEnregistree(models.Model):
    """
    Paroisses sauvegardées en favoris par un visiteur authentifié.
    Contrainte : un visiteur ne peut enregistrer une paroisse qu'une seule fois.
    """
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paroisses_enregistrees",
    )
    paroisse = models.ForeignKey(
        "geo.Paroisse",
        on_delete=models.CASCADE,
        related_name="enregistrements_visiteurs",
    )
    note_personnelle = models.TextField(blank=True)
    enregistree_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Paroisse Enregistrée"
        verbose_name_plural = "Paroisses Enregistrées"
        unique_together = ("utilisateur", "paroisse")
        ordering = ["-enregistree_at"]

    def __str__(self):
        return f"{self.utilisateur.email} ♥ {self.paroisse.nom}"


# =============================================================================
# PERSISTANCE GÉNÉRIQUE DE LA CARTE (paroisses ET œuvres)
# =============================================================================
# Les favoris/historique de la carte visiteur peuvent porter sur n'importe quelle
# entité affichée (paroisse OU œuvre). On stocke une référence générique
# (type_entite, entite_id) plutôt qu'une FK, pour rester simple et robuste.
# Le frontend reconstruit l'élément complet depuis les données déjà chargées.

ENTITE_TYPES = [("paroisse", "Paroisse"), ("oeuvre", "Œuvre")]


class FavoriCarte(models.Model):
    """Favori (étoile) d'un visiteur sur la carte — paroisse ou œuvre."""
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favoris_carte",
    )
    type_entite = models.CharField(max_length=20, choices=ENTITE_TYPES)
    entite_id   = models.IntegerField()
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Favori Carte"
        verbose_name_plural = "Favoris Carte"
        unique_together = ("utilisateur", "type_entite", "entite_id")
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["utilisateur", "created_at"])]

    def __str__(self):
        return f"{self.utilisateur.email} ★ {self.type_entite}#{self.entite_id}"


class ConsultationCarte(models.Model):
    """Historique de consultation d'un visiteur — paroisse ou œuvre."""
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consultations_carte",
    )
    type_entite = models.CharField(max_length=20, choices=ENTITE_TYPES)
    entite_id   = models.IntegerField()
    vue_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Consultation Carte"
        verbose_name_plural = "Consultations Carte"
        ordering = ["-vue_at"]
        indexes = [models.Index(fields=["utilisateur", "vue_at"])]

    def __str__(self):
        return f"{self.utilisateur.email} 👁 {self.type_entite}#{self.entite_id}"
