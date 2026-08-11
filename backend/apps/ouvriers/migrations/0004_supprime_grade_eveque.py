"""
Retire le grade « Évêque » de la hiérarchie ecclésiastique.

POURQUOI :
  Ce grade n'existe pas dans l'Église Évangélique du Cameroun. Il avait été
  saisi par erreur au niveau 1 lors de l'import initial des grades.
  import_grades.py ne le crée plus, mais il utilise update_or_create() et ne
  supprime donc jamais un grade devenu obsolète : sans cette migration, la
  ligne survivait à tous les réimports, et à tout déploiement.

SÉCURITÉ :
  Grade est référencé par Ouvrier via un ForeignKey PROTECT. La suppression
  est donc conditionnée à l'absence d'ouvrier rattaché — au 4 août 2026 la
  base en comptait zéro. Si un ouvrier venait à porter ce grade, la migration
  laisse la ligne en place plutôt que d'échouer ou de casser des données :
  c'est alors à l'EEC de reclasser l'ouvrier avant de rejouer le retrait.
"""
from django.db import migrations

NOM_GRADE = "Évêque"


def supprimer_eveque(apps, schema_editor):
    Grade = apps.get_model("ouvriers", "Grade")
    grade = Grade.objects.filter(nom=NOM_GRADE).first()
    if grade is None:
        return  # déjà absent : rien à faire
    if grade.ouvriers.exists():
        # Des ouvriers y sont rattachés — on ne touche à rien.
        return
    grade.delete()


def restaurer_eveque(apps, schema_editor):
    """Rétablit la ligne pour permettre un retour arrière propre.

    Le niveau 1 est resté libre : aucun autre grade ne l'occupe (la hiérarchie
    va de 2 « Pasteur » à 8 « Aide-Évangéliste »), la réinsertion ne peut donc
    pas entrer en conflit.
    """
    Grade = apps.get_model("ouvriers", "Grade")
    Grade.objects.get_or_create(
        nom=NOM_GRADE,
        defaults={"niveau": 1, "abreviation": "Év."},
    )


class Migration(migrations.Migration):

    dependencies = [
        ("ouvriers", "0003_alter_ouvrier_statut"),
    ]

    operations = [
        migrations.RunPython(supprimer_eveque, restaurer_eveque),
    ]
