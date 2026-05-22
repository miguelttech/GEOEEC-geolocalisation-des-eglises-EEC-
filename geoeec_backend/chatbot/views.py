from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from langchain_ollama import OllamaLLM
import traceback
import os

# Importer tes modèles Django
from paroisses.models import Paroisse
from oeuvres.models import Oeuvre
from ouvriers.models import Ouvrier

# Configuration du modèle local
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
llm = OllamaLLM(
    model="phi3:mini",
    base_url=OLLAMA_BASE_URL,
    temperature=0.5,   # réponses cohérentes
    max_tokens=200     # concises et rapides
)

@api_view(['POST'])
def chatbot_ask(request):
    try:
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"error": "La question est requise."}, status=status.HTTP_400_BAD_REQUEST)

        # Identifier le type d'entité
        entity_type = None
        q_lower = question.lower()
        if "paroisse" in q_lower:
            entity_type = "paroisse"
        elif "oeuvre" in q_lower:
            entity_type = "oeuvre"
        elif "ouvrier" in q_lower:
            entity_type = "ouvrier"

        # Charger uniquement les champs nécessaires
        if entity_type == "paroisse":
            data = list(Paroisse.objects.values("nom", "district", "region_synodale", "communiants"))
        elif entity_type == "oeuvre":
            data = list(Oeuvre.objects.values("nom", "type", "niveau", "paroisse__nom"))
        elif entity_type == "ouvrier":
            data = list(Ouvrier.objects.values("nom", "grade", "district", "region_synodale", "paroisse_nom"))
        else:
            data = []

        # Construire le contexte pour Phi3:mini
        context = f"""
        Tu es un assistant pour l'application GeoEEC.
        Tu réponds aux questions des utilisateurs sur les paroisses, œuvres et ouvriers.
        Fournis toujours une réponse claire, concise et structurée en français.
        Ne liste toutes les données que si l'utilisateur le demande explicitement.
        Données pertinentes : {data}
        Question de l'utilisateur : {question}
        """

        # Générer la réponse
        answer = llm.invoke(context)

        return Response({"answer": answer}, status=status.HTTP_200_OK)

    except Exception as e:
        traceback_str = traceback.format_exc()
        return Response({"error": str(e), "traceback": traceback_str}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
