import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LogActivite",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(
                    max_length=10,
                    choices=[
                        ("LOGIN",  "Connexion"),
                        ("LOGOUT", "Déconnexion"),
                        ("CREATE", "Création"),
                        ("UPDATE", "Modification"),
                        ("DELETE", "Suppression"),
                        ("IMPORT", "Import"),
                        ("EXPORT", "Export"),
                        ("VIEW",   "Consultation"),
                    ],
                )),
                ("type_objet", models.CharField(
                    blank=True,
                    max_length=20,
                    choices=[
                        ("paroisse",    "Paroisse"),
                        ("district",    "District"),
                        ("region",      "Région"),
                        ("oeuvre",      "Œuvre"),
                        ("ouvrier",     "Ouvrier"),
                        ("user",        "Utilisateur"),
                        ("statistique", "Statistique"),
                        ("import",      "Import"),
                        ("systeme",     "Système"),
                    ],
                )),
                ("objet_id",    models.IntegerField(blank=True, null=True)),
                ("objet_nom",   models.CharField(blank=True, max_length=200)),
                ("description", models.TextField(blank=True)),
                ("ip_address",  models.GenericIPAddressField(blank=True, null=True)),
                ("created_at",  models.DateTimeField(auto_now_add=True)),
                ("utilisateur", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="activites",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "verbose_name":        "Log d'Activité",
                "verbose_name_plural": "Logs d'Activité",
                "ordering":            ["-created_at"],
            },
        ),
    ]
