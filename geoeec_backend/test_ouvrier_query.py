from pathlib import Path
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import FAISS
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate

# ⚙️ Config
OLLAMA_URL = "http://127.0.0.1:11434"
BASE_DIR = Path(__file__).resolve().parent / "chatbot" / "vectorstores"

# 🧠 Initialisation des composants LLM + Embedding
llm = OllamaLLM(model="phi3:mini", base_url=OLLAMA_URL)
embeddings = OllamaEmbeddings(model="phi3:mini", base_url=OLLAMA_URL)

# 📁 Index disponibles
INDEXES = {
    "paroisses": "paroisses_index_phi3",
    "oeuvres": "oeuvres_index_phi3",
    "ouvriers": "ouvriers_index_phi3"
}

# ❓ Choix de l'index à tester
selected_index_key = "ouvriers"  # 👉 "paroisses", "oeuvres", "ouvriers"
question = "ombien avons nous d evangeliste (EV) ?"

# 📍 Chemin d'accès à l'index
index_path = BASE_DIR / INDEXES[selected_index_key]
print(f"📂 Chemin utilisé : {index_path}")

if not index_path.exists():
    raise FileNotFoundError(f"❌ L'index '{selected_index_key}' n'existe pas à l'emplacement {index_path}")

# 🔄 Chargement de la base vectorielle
db = FAISS.load_local(str(index_path), embeddings, allow_dangerous_deserialization=True)
retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 3})

# 🧠 Prompt personnalisé
template = """Tu es un assistant intelligent pour interroger la base de données des {index_label} de l'EEC.

Contexte :
{context}

Question de l'utilisateur :
{question}

Réponds de manière claire, concise et exacte.
"""
template = template.replace("{index_label}", selected_index_key.upper())

prompt = PromptTemplate(
    input_variables=["context", "question"],
    template=template
)

# 🔁 Création de la chaîne
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff",
    chain_type_kwargs={"prompt": prompt},
    return_source_documents=True
)

# ▶️ Test
if __name__ == "__main__":
    print(f"🔍 Interrogation de l'index : {selected_index_key}")
    print(f"❓ Question : {question}")
    result = qa_chain.invoke({"query": question})
    answer = result["result"]
    print(f"✅ Réponse : {answer}")

