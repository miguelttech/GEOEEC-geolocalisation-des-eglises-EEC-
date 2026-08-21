"""
Convertit les statuts hérités « ACTIF » en « OCCUPE ».

POURQUOI :
  La migration 0003 a remplacé les choix du champ `statut` par
  (OCCUPE, INOCCUPE) sans convertir les lignes existantes. 663 ouvriers sur
  666 portaient donc encore « ACTIF », valeur absente des choix du modèle.

CE QUE ÇA CASSAIT :
  - L'interface affichait « ACTIF », un statut qui n'existe plus.
  - Le filtre par statut ne les retrouvait ni en « Occupé » ni en « Inoccupé ».
  - Surtout : la règle métier de réaffectation teste `statut == "OCCUPE"`
    avant d'exiger qu'un ouvrier soit retiré de sa paroisse. Avec « ACTIF »,
    ce test était toujours faux — le garde-fou était donc silencieusement
    inopérant pour 99,5 % des ouvriers.

CORRESPONDANCE :
  ACTIF → OCCUPE. Un ouvrier « actif » était affecté à une paroisse, ce que
  « occupé » désigne exactement dans le vocabulaire retenu. Les valeurs déjà
  conformes ne sont pas touchées.
"""
from django.db import migrations


def actif_vers_occupe(apps, schema_editor):
    Ouvrier = apps.get_model("ouvriers", "Ouvrier")
    Ouvrier.objects.filter(statut="ACTIF").update(statut="OCCUPE")


def occupe_vers_actif(apps, schema_editor):
    """Retour arrière impossible à distinguer.

    Les ouvriers déjà « OCCUPE » avant cette migration et ceux convertis
    depuis « ACTIF » sont désormais indiscernables. Restaurer « ACTIF » pour
    tous réintroduirait la valeur invalide sur des lignes qui ne l'avaient
    pas. On préfère ne rien défaire : la migration est sans perte, seule sa
    réversibilité l'est.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("ouvriers", "0004_supprime_grade_eveque"),
    ]

    operations = [
        migrations.RunPython(actif_vers_occupe, occupe_vers_actif),
    ]
