from django.db import models
from django.conf import settings


class LogActivite(models.Model):
    ACTIONS = [
        ("LOGIN",   "Connexion"),
        ("LOGOUT",  "Déconnexion"),
        ("CREATE",  "Création"),
        ("UPDATE",  "Modification"),
        ("DELETE",  "Suppression"),
        ("IMPORT",  "Import"),
        ("EXPORT",  "Export"),
        ("VIEW",    "Consultation"),
    ]

    TYPE_OBJET = [
        ("paroisse",    "Paroisse"),
        ("district",    "District"),
        ("region",      "Région"),
        ("oeuvre",      "Œuvre"),
        ("ouvrier",     "Ouvrier"),
        ("user",        "Utilisateur"),
        ("statistique", "Statistique"),
        ("import",      "Import"),
        ("systeme",     "Système"),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="activites",
    )
    action      = models.CharField(max_length=10, choices=ACTIONS)
    type_objet  = models.CharField(max_length=20, choices=TYPE_OBJET, blank=True)
    objet_id    = models.IntegerField(null=True, blank=True)
    objet_nom   = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log d'Activité"
        verbose_name_plural = "Logs d'Activité"
        ordering = ["-created_at"]

    def __str__(self):
        user = self.utilisateur.get_full_name() if self.utilisateur else "Anonyme"
        return f"{self.created_at:%d/%m/%Y %H:%M} — {user} — {self.get_action_display()}"
