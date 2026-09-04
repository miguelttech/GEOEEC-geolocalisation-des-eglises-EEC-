"""
Ajoute le grade « Révérant Docteur » (Rév Dr) à la hiérarchie ecclésiastique.

POURQUOI UNE MIGRATION :
  import_grades.py crée bien ce grade, mais cette commande n'est jouée qu'au
  peuplement initial. Sans migration, une base déjà déployée ne verrait jamais
  la nouvelle ligne, et l'import des ouvriers Rév Dr échouerait faute de grade.

NIVEAU 1 :
  Le niveau 1 était libre depuis le retrait d'« Évêque » (migration 0004) ;
  c'est le seul emplacement disponible en tête de hiérarchie, et le rang
  attendu pour un pasteur titulaire d'un doctorat. La numérotation existante
  (2 « Pasteur » à 8 « Aide-Évangéliste ») n'est donc pas décalée.

  Conséquence sur 0004 : sa fonction de retour arrière réinsère « Évêque » au
  niveau 1. Un rollback jusqu'à 0003 ferait donc cohabiter deux grades sur ce
  niveau — sans erreur, `niveau` n'étant pas unique, mais l'ordre d'affichage
  entre les deux serait arbitraire. Ce scénario suppose de défaire aussi la
  présente migration, qui retire la ligne : le conflit ne peut pas survenir en
  pratique.

SOURCE :
  « data/Rev_Dr_fusionne.docx » — 29 ouvriers portant ce grade, importés par
  la commande import_rev_dr.
"""
from django.db import migrations

NOM_GRADE = "Révérant Docteur"


def creer_rev_dr(apps, schema_editor):
    Grade = apps.get_model("ouvriers", "Grade")
    Grade.objects.update_or_create(
        nom=NOM_GRADE,
        defaults={"niveau": 1, "abreviation": "Rév Dr"},
    )


def supprimer_rev_dr(apps, schema_editor):
    """Retire la ligne, sauf si des ouvriers y sont rattachés.

    Grade est référencé par Ouvrier via un ForeignKey PROTECT : supprimer un
    grade porté par un ouvrier lèverait une erreur et bloquerait le retour
    arrière. On laisse alors la ligne en place — à l'EEC de reclasser ces
    ouvriers avant de rejouer le retrait.
    """
    Grade = apps.get_model("ouvriers", "Grade")
    grade = Grade.objects.filter(nom=NOM_GRADE).first()
    if grade is None or grade.ouvriers.exists():
        return
    grade.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("ouvriers", "0005_statut_actif_vers_occupe"),
    ]

    operations = [
        migrations.RunPython(creer_rev_dr, supprimer_rev_dr),
    ]
