"""
=============================================================================
FICHIER N°4 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/oeuvres/management/commands/import_typeoeuvre.py
CRÉÉ     : Phase 2 — Import des données de référence
DÉPEND DE: apps/oeuvres/models.py (le modèle TypeOeuvre doit exister)
DOIT ÊTRE EXÉCUTÉ AVANT: import_oeuvres.py (les oeuvres ont besoin des types)
=============================================================================

OBJECTIF :
  Créer les 7 types d'oeuvres officiels de l'EEC dans la base de données.
  Ces types sont des données FIXES qui servent de classification pour
  toutes les oeuvres (écoles, hôpitaux, fermes, etc.) de l'EEC.

QU'EST-CE QU'UNE "OEUVRE" DANS L'EEC ?
  Une "oeuvre" est une réalisation concrète de l'Église Évangélique du Cameroun :
  une école, un hôpital, une ferme, un immeuble commercial, un terrain.
  Ces oeuvres sont réparties dans tout le Cameroun et gérées par les paroisses,
  les districts ou les régions synodales.
  On parle d'"oeuvres" car ce sont les "oeuvres" (travaux) visibles de l'Église.

POURQUOI DES TYPES FIXES ET PAS UN FICHIER EXCEL ?
  Les 7 types sont des catégories officiellement définies par les statuts de l'EEC.
  Ils ne changent pas selon les paroisses ni les années.
  → Comme pour les grades (import_grades.py), on les code directement.

PRINCIPE DE "LOOKUP TABLE" (table de référence) :
  C'est un concept courant en base de données :
  - Une petite table avec des valeurs stables (ici : 7 types)
  - Une grande table qui référence ces valeurs via une clé étrangère
  Structure : TypeOeuvre (7 lignes) ← Oeuvre (311 lignes via FK type_oeuvre)
  Au lieu de stocker "SCOLAIRE" dans chaque oeuvre → on stocke l'id du TypeOeuvre.
  Avantage : si on veut changer le nom d'un type, on ne change qu'une seule ligne.

LES 7 TYPES ET LEUR RÔLE SUR LA CARTE :
  1. SCOLAIRE      (#2563EB bleu)    → écoles primaires, collèges, lycées EEC
  2. UNIVERSITAIRE (#7C3AED violet)  → instituts et facultés protestantes
  3. MEDICALE      (#DC2626 rouge)   → hôpitaux, dispensaires, centres de santé
  4. AGROPASTORALE (#16A34A vert)    → fermes, élevages, projets agricoles
  5. IMMEUBLE      (#D97706 orange)  → bâtiments commerciaux, résidences
  6. TERRAIN       (#78716C gris-brun)→ parcelles de terrain en propriété EEC
  7. AUTRE         (#64748B gris)    → tout ce qui ne rentre dans aucune catégorie

COULEURS ET ICÔNES :
  La couleur et l'icône de chaque type seront utilisées par le frontend Leaflet
  pour afficher des marqueurs de couleurs différentes sur la carte.
  Exemple : un hôpital → marqueur rouge avec icône "heart-pulse"
            une école  → marqueur bleu avec icône "school"

COMMANDE D'EXÉCUTION :
  docker compose run --rm backend python manage.py import_typeoeuvre

IDEMPOTENT :
  Ce script peut être relancé sans créer de doublons.
  update_or_create() cherche d'abord si le type existe, puis crée ou met à jour.
=============================================================================
"""

# BaseCommand : classe de base Django pour les commandes de gestion
from django.core.management.base import BaseCommand

# TypeOeuvre : le modèle Django de la table des types d'oeuvres
from apps.oeuvres.models import TypeOeuvre


# =============================================================================
# DONNÉES DES 7 TYPES D'OEUVRES
#
# Chaque type est un dictionnaire Python avec 3 clés :
#   - nom     : le code interne (doit correspondre aux choix dans models.py)
#   - icone   : nom d'icône Lucide (bibliothèque d'icônes React utilisée en frontend)
#   - couleur : code hexadécimal de la couleur du marqueur sur la carte
#
# FORMAT HEXADÉCIMAL (#RRGGBB) :
#   #2563EB = Rouge:0x25=37, Vert:0x63=99, Bleu:0xEB=235 → bleu vif
#   #DC2626 = Rouge:0xDC=220, Vert:0x26=38, Bleu:0x26=38 → rouge vif
#   On peut tester les couleurs sur : https://www.color-hex.com/
# =============================================================================
TYPES_OEUVRES = [

    # TYPE 1 : Oeuvres scolaires — les plus nombreuses de l'EEC
    # Icône "school" = icône de bâtiment scolaire (chapeau de diplôme)
    # Couleur bleue : couleur internationale de l'éducation
    {
        "nom":     "SCOLAIRE",       # code stocké en base (dans la colonne "nom")
        "icone":   "school",         # nom d'icône Lucide React utilisée sur la carte
        "couleur": "#2563EB",        # bleu vif (#2563EB = blue-600 Tailwind CSS)
    },

    # TYPE 2 : Oeuvres universitaires
    # Icône "graduation-cap" = chapeau de diplômé universitaire
    # Couleur violette : couleur académique des universités
    {
        "nom":     "UNIVERSITAIRE",
        "icone":   "graduation-cap",
        "couleur": "#7C3AED",        # violet (#7C3AED = violet-700 Tailwind CSS)
    },

    # TYPE 3 : Oeuvres médicales — hôpitaux, dispensaires, centres de santé
    # Icône "heart-pulse" = coeur avec ligne de battement cardiaque
    # Couleur rouge : couleur internationale de la santé (croix rouge)
    {
        "nom":     "MEDICALE",
        "icone":   "heart-pulse",
        "couleur": "#DC2626",        # rouge vif (#DC2626 = red-600 Tailwind CSS)
    },

    # TYPE 4 : Oeuvres agropastorales — fermes et projets agricoles
    # Icône "sprout" = une jeune pousse qui sort de terre
    # Couleur verte : couleur de la nature et de l'agriculture
    {
        "nom":     "AGROPASTORALE",
        "icone":   "sprout",
        "couleur": "#16A34A",        # vert (#16A34A = green-600 Tailwind CSS)
    },

    # TYPE 5 : Immeubles — bâtiments commerciaux ou résidentiels
    # Icône "building-2" = bâtiment avec plusieurs étages
    # Couleur orange : couleur des constructions et de l'immobilier
    {
        "nom":     "IMMEUBLE",
        "icone":   "building-2",
        "couleur": "#D97706",        # orange (#D97706 = amber-600 Tailwind CSS)
    },

    # TYPE 6 : Terrains — parcelles de terrain en propriété EEC
    # Icône "map-pin" = épingle sur une carte (représente un terrain)
    # Couleur gris-brun : couleur de la terre et des terrains
    {
        "nom":     "TERRAIN",
        "icone":   "map-pin",
        "couleur": "#78716C",        # gris-brun (#78716C = stone-500 Tailwind CSS)
    },

    # TYPE 7 : Autres oeuvres — catégorie fourre-tout pour tout le reste
    # Icône "circle-help" = cercle avec point d'interrogation
    # Couleur gris neutre : couleur neutre pour les oeuvres non classifiées
    {
        "nom":     "AUTRE",
        "icone":   "circle-help",
        "couleur": "#64748B",        # gris (#64748B = slate-500 Tailwind CSS)
    },
]


# =============================================================================
# CLASSE PRINCIPALE : Command
# =============================================================================
class Command(BaseCommand):
    """
    Commande Django qui crée les 7 types d'oeuvres officiels de l'EEC.
    Django l'exécute quand on lance : python manage.py import_typeoeuvre
    """

    # Message d'aide affiché avec --help
    help = "Crée les 7 types d'oeuvres officiels de l'EEC en base de données"

    def handle(self, *args, **options):
        """
        Méthode principale appelée par Django.
        Pas d'arguments optionnels ici : cette commande est simple et directe.
        """

        # Afficher un titre et un séparateur pour la lisibilité dans le terminal
        self.stdout.write("Creation des 7 types d'oeuvres EEC ...")
        self.stdout.write("=" * 45)

        # Compteurs pour le bilan final
        nb_crees = 0  # Types nouvellement créés
        nb_maj   = 0  # Types déjà existants, mis à jour

        # Boucler sur chacun des 7 types définis ci-dessus
        for type_data in TYPES_OEUVRES:

            # update_or_create() : méthode Django idempotente
            # Fonctionnement :
            #   1. Cherche un TypeOeuvre avec nom=type_data["nom"]
            #   2. S'il EXISTE → met à jour icone et couleur
            #   3. S'il N'EXISTE PAS → crée un nouveau TypeOeuvre
            #
            # nom=type_data["nom"]  : clé de recherche (le code du type)
            # defaults={...}        : valeurs à créer ou mettre à jour
            #
            # Retourne (objet_type, a_ete_cree)
            # obj     : l'objet TypeOeuvre (créé ou mis à jour)
            # created : True si création, False si mise à jour
            obj, created = TypeOeuvre.objects.update_or_create(
                nom=type_data["nom"],      # chercher par le code (ex: "SCOLAIRE")
                defaults={
                    "icone":   type_data["icone"],    # mettre à jour l'icône
                    "couleur": type_data["couleur"],  # mettre à jour la couleur
                },
            )

            if created:
                nb_crees += 1
                # obj.get_nom_display() : retourne le libellé lisible du choix
                # Dans le modèle, "SCOLAIRE" peut avoir le libellé "Scolaire"
                # C'est défini dans le champ avec choices=TYPES dans models.py
                self.stdout.write(self.style.SUCCESS(
                    f"  CREE   : {obj.get_nom_display():15s} "
                    f"| icone={type_data['icone']:20s} | couleur={type_data['couleur']}"
                ))
            else:
                nb_maj += 1
                self.stdout.write(
                    f"  MAJ    : {obj.get_nom_display():15s} "
                    f"| icone={type_data['icone']:20s} | couleur={type_data['couleur']}"
                )

        # Afficher le bilan final en vert
        self.stdout.write("=" * 45)
        self.stdout.write(self.style.SUCCESS(
            f"TERMINE — {nb_crees} crees | {nb_maj} mis a jour"
        ))
