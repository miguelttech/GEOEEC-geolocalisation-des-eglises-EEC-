"""
=============================================================================
FICHIER N°16 (dans l'ordre de création du projet)
CHEMIN   : backend/apps/ouvriers/views.py
CRÉÉ     : Phase 3 — APIs REST
DÉPEND DE: apps/ouvriers/serializers.py, apps/ouvriers/models.py
UTILISÉ PAR: eec_core/urls.py
=============================================================================

OBJECTIF :
  Logique des endpoints pour les grades et les ouvriers de l'EEC.

ENDPOINTS GÉRÉS ICI :
  GET /api/ouvriers/grades/                → liste des 8 grades
  GET /api/ouvriers/grades/{id}/           → un grade précis
  GET /api/ouvriers/ouvriers/              → liste des 685 ouvriers
  GET /api/ouvriers/ouvriers/{id}/         → un ouvrier précis
  GET /api/ouvriers/ouvriers/?grade=2      → seulement les Pasteurs
  GET /api/ouvriers/ouvriers/?paroisse=5   → ouvriers d'une paroisse
  GET /api/ouvriers/ouvriers/?search=TAKAM → recherche par nom

UTILISATION TYPIQUE DANS LE FRONTEND :
  Quand on clique sur une paroisse sur la carte, la fiche paroisse
  affiche la liste des ouvriers : GET /api/ouvriers/ouvriers/?paroisse=5
=============================================================================
"""

# Count : pour compter les ouvriers par grade en SQL
from django.db.models import Count

from rest_framework import viewsets, permissions

from .models import Grade, Ouvrier
from .serializers import GradeSerializer, OuvrierSerializer


# =============================================================================
# VIEW 1 : Grades
# URL : GET /api/ouvriers/grades/
# URL : GET /api/ouvriers/grades/{id}/
# =============================================================================
class GradeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API pour les 8 grades ecclésiastiques, triés du plus haut au plus bas.

    EXEMPLE DE RÉPONSE :
    {
      "count": 8,
      "results": [
        {"id": 1, "nom": "Évêque",    "abreviation": "Év.", "niveau": 1, "nb_ouvriers": 0},
        {"id": 2, "nom": "Pasteur",   "abreviation": "P.",  "niveau": 2, "nb_ouvriers": 296},
        {"id": 5, "nom": "Évangéliste","abreviation": "Ev.", "niveau": 5, "nb_ouvriers": 206},
        ...
      ]
    }

    UTILISATION :
    Le frontend peut afficher une légende "Grades EEC" avec le nombre
    d'ouvriers pour chaque grade — utile pour filtrer la carte.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = GradeSerializer  # Toujours ce serializer, pas de variation

    def get_queryset(self):
        """
        Récupère les grades avec le nombre d'ouvriers pour chacun.

        .annotate(nb_ouvriers=Count("ouvriers")) :
        Pour chaque grade, compte les ouvriers liés via la FK grade.ouvriers
        (relation inverse définie par related_name="ouvriers" dans le modèle Ouvrier).

        SQL généré :
          SELECT grade.*, COUNT(ouvrier.id) AS nb_ouvriers
          FROM ouvriers_grade grade
          LEFT JOIN ouvriers_ouvrier ouvrier ON ouvrier.grade_id = grade.id
          GROUP BY grade.id
          ORDER BY grade.niveau
        """
        return (
            Grade.objects
            .annotate(nb_ouvriers=Count("ouvriers"))  # COUNT des ouvriers par grade
            .order_by("niveau")   # Ordre hiérarchique : 1=Évêque, 2=Pasteur…
        )


# =============================================================================
# VIEW 2 : Ouvriers
# URL : GET /api/ouvriers/ouvriers/
# URL : GET /api/ouvriers/ouvriers/{id}/
# URL : GET /api/ouvriers/ouvriers/?grade={id}
# URL : GET /api/ouvriers/ouvriers/?paroisse={id}
# URL : GET /api/ouvriers/ouvriers/?district={id}
# URL : GET /api/ouvriers/ouvriers/?region={id}
# URL : GET /api/ouvriers/ouvriers/?search={texte}
# =============================================================================
class OuvrierViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API pour les 685 ouvriers de l'EEC.

    FILTRES DISPONIBLES (cumulables) :
      ?grade={id}     → filtre par grade (ex: ?grade=2 pour les Pasteurs)
      ?paroisse={id}  → ouvriers affectés à une paroisse précise
      ?district={id}  → ouvriers des paroisses d'un district
      ?region={id}    → ouvriers des paroisses d'une région
      ?search={texte} → recherche par nom de famille (insensible à la casse)

    EXEMPLES :
      /api/ouvriers/ouvriers/?grade=2                → 296 Pasteurs
      /api/ouvriers/ouvriers/?paroisse=42            → ouvriers de la paroisse n°42
      /api/ouvriers/ouvriers/?region=10              → ouvriers de l'ADAMAOUA
      /api/ouvriers/ouvriers/?search=TAKAM           → ouvriers nommés TAKAM
      /api/ouvriers/ouvriers/?grade=5&region=10      → Évangélistes de l'ADAMAOUA
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = OuvrierSerializer

    def get_queryset(self):
        """
        Construit la requête avec les filtres demandés.

        .select_related() : charge toutes les relations en une seule requête SQL.
          grade → pour grade_nom et grade_abreviation
          paroisse → pour paroisse_nom
          paroisse__district → pour district_nom
          paroisse__district__region → pour region_nom

        Sans select_related, Django ferait des requêtes séparées pour chaque
        ouvrier (685 × 4 = 2740 requêtes). Avec select_related : 1 seule requête.
        """
        qs = (
            Ouvrier.objects
            .select_related(
                "grade",                         # charge le grade lié
                "paroisse",                      # charge la paroisse liée
                "paroisse__district",            # charge le district de la paroisse
                "paroisse__district__region",    # charge la région du district
            )
            .order_by("nom", "prenom")  # ordre alphabétique par nom puis prénom
        )

        params = self.request.query_params  # Dictionnaire des paramètres GET

        # Filtre par grade : WHERE grade_id = ?
        grade_id = params.get("grade")
        if grade_id:
            qs = qs.filter(grade_id=grade_id)

        # Filtre par paroisse : WHERE paroisse_id = ?
        paroisse_id = params.get("paroisse")
        if paroisse_id:
            qs = qs.filter(paroisse_id=paroisse_id)

        # Filtre par district : WHERE paroisse.district_id = ?
        district_id = params.get("district")
        if district_id:
            qs = qs.filter(paroisse__district_id=district_id)

        # Filtre par région : WHERE paroisse.district.region_id = ?
        region_id = params.get("region")
        if region_id:
            qs = qs.filter(paroisse__district__region_id=region_id)

        # Recherche textuelle sur le nom (icontains = LIKE insensible à la casse)
        # Exemple : ?search=takam trouve "TAKAM", "Takam", "takam"
        search = params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)

        return qs
