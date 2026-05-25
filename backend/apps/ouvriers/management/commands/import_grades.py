"""
=============================================================================
FICHIER N°6 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/ouvriers/management/commands/import_grades.py
CRÉÉ     : Phase 2 — Import des données
DÉPEND DE: apps/ouvriers/models.py (le modèle Grade doit exister)
DOIT ÊTRE EXÉCUTÉ AVANT: import_ouvriers.py (les ouvriers ont besoin des grades)
=============================================================================

OBJECTIF :
  Créer les 8 grades ecclésiastiques de l'EEC dans la base de données.

POURQUOI CE FICHIER ET PAS UN FICHIER EXCEL ?
  Les grades sont des données FIXES définies par les statuts de l'EEC.
  Ils ne changent pas selon les paroisses ou les années.
  Il n'existe pas de colonne "grade" dans les fichiers Excel sources —
  les grades sont une classification interne à l'EEC.
  → On les code directement dans le script (données "en dur").

QU'EST-CE QU'UNE COMMANDE DE GESTION DJANGO ?
  C'est un script Python qu'on exécute depuis le terminal avec :
    python manage.py import_grades
  Django trouve ce fichier automatiquement grâce à son emplacement :
    apps/ouvriers/management/commands/import_grades.py
  Le nom du fichier (import_grades) devient le nom de la commande.

IDEMPOTENT :
  Ce script peut être exécuté plusieurs fois sans créer de doublons.
  Il utilise update_or_create() : si un grade existe déjà → mise à jour.
  Si il n'existe pas → création.

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_grades
=============================================================================
"""

# BaseCommand : classe de base que toute commande de gestion Django doit hériter
from django.core.management.base import BaseCommand

# Grade : le modèle de la table ouvriers_grade dans PostgreSQL
from apps.ouvriers.models import Grade


# =============================================================================
# DONNÉES FIXES : les 8 grades de l'EEC
# Chaque grade est un dictionnaire avec 3 clés :
#   - niveau     : position dans la hiérarchie (1=plus haut, 8=plus bas)
#   - nom        : nom complet du grade
#   - abreviation: forme courte pour les cartes et listes compactes
# =============================================================================
GRADES = [
    # Niveau 1 : le plus haut grade — responsable d'une région synodale entière
    {"niveau": 1, "nom": "Évêque",                                     "abreviation": "Év."},

    # Niveau 2 : agent pastoral principal, responsable d'une paroisse
    {"niveau": 2, "nom": "Pasteur",                                     "abreviation": "P."},

    # Niveau 3 : futur pasteur en cours de formation et de consécration
    {"niveau": 3, "nom": "Pasteur Proposant",                           "abreviation": "P.P."},

    # Niveau 4 : proposant qui a déjà une délégation pastorale (responsabilité partielle)
    {"niveau": 4, "nom": "Pasteur Proposant avec Délégation Pastorale", "abreviation": "P.P.D.P."},

    # Niveau 5 : agent évangélique, moins de formation théologique qu'un pasteur
    {"niveau": 5, "nom": "Évangéliste",                                 "abreviation": "Ev."},

    # Niveau 6 : évangéliste avec délégation pastorale (responsabilité étendue)
    {"niveau": 6, "nom": "Évangéliste avec Délégation Pastorale",       "abreviation": "Ev.D.P."},

    # Niveau 7 : délégué sans ordination, représentant pastoral
    {"niveau": 7, "nom": "Délégué Pastoral",                            "abreviation": "D.P."},

    # Niveau 8 : le grade le plus bas, agent auxiliaire en formation
    {"niveau": 8, "nom": "Aide-Évangéliste",                            "abreviation": "A.Ev."},
]


class Command(BaseCommand):
    """
    Classe principale de la commande.

    Django exige que chaque commande de gestion soit une classe
    qui hérite de BaseCommand et implémente la méthode handle().
    """

    # Message d'aide affiché quand on fait : python manage.py import_grades --help
    help = "Crée les 8 grades ecclésiastiques de l'EEC"

    def handle(self, *args, **options):
        """
        Méthode principale appelée quand on exécute la commande.
        *args et **options permettent de recevoir des arguments en ligne de commande.
        """
        nb_crees = 0  # Compteur de grades nouvellement créés
        nb_maj   = 0  # Compteur de grades déjà existants (mis à jour)

        # Boucler sur chaque grade défini dans la liste GRADES
        for g in GRADES:
            # update_or_create() : méthode Django qui fait deux choses en une :
            #   - Si un Grade avec ce nom existe → le mettre à jour avec "defaults"
            #   - Sinon → en créer un nouveau avec "nom" + "defaults"
            #
            # nom=g["nom"] : c'est la "clé de recherche" (unique dans la table)
            # defaults={...} : les champs à créer ou mettre à jour
            #
            # Retourne un tuple : (objet_grade, a_ete_cree)
            _, created = Grade.objects.update_or_create(
                nom=g["nom"],   # chercher un grade avec ce nom
                defaults={
                    "niveau":      g["niveau"],       # mettre à jour le niveau
                    "abreviation": g["abreviation"],  # mettre à jour l'abréviation
                },
            )

            if created:
                # Le grade vient d'être créé pour la première fois
                nb_crees += 1
                self.stdout.write(f"  CRÉÉ   niv.{g['niveau']:2d}  {g['abreviation']:10s} {g['nom']}")
            else:
                # Le grade existait déjà → juste mis à jour
                nb_maj += 1
                self.stdout.write(f"  EXISTE niv.{g['niveau']:2d}  {g['abreviation']:10s} {g['nom']}")

        # Afficher le résumé final
        # self.style.SUCCESS() colore le texte en vert dans le terminal
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"IMPORT GRADES TERMINÉ — {nb_crees} créés, {nb_maj} déjà existants"
        ))
