import json
from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings  # Utilisation du modèle phi3
from langchain.docstore.document import Document

# Chemins
BASE_DIR = Path(__file__).resolve().parent
EXPORT_DIR = BASE_DIR / "export"
INDEX_DIR = BASE_DIR / "vectorstores"
INDEX_DIR.mkdir(parents=True, exist_ok=True)

# ✅ Embedding Ollama (modèle phi3:mini local)
embedding_model = OllamaEmbeddings(model="phi3:mini", base_url="http://127.0.0.1:11434")

# Convertit un fichier JSON en documents LangChain
def json_to_documents(json_path: Path, tag: str):
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    docs = []
    for item in data:
        content = "\n".join([f"{key.capitalize()} : {value}" for key, value in item.items()])
        doc = Document(page_content=f"[{tag}]\n{content}")
        docs.append(doc)
    return docs

# Fonction d'indexation
def index_dataset(json_file: str, tag: str, index_name: str):
    print(f"📚 Indexation de {json_file} avec phi3:mini...")

    docs = json_to_documents(EXPORT_DIR / json_file, tag)

    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    vectordb = FAISS.from_documents(chunks, embedding_model)
    vectordb.save_local(str(INDEX_DIR / index_name))
    print(f"✅ {tag} indexé et sauvegardé sous vectorstores/{index_name}")

if __name__ == "__main__":
    index_dataset("oeuvres.json", "ŒUVRE", "oeuvres_index_phi3")
    index_dataset("paroisses.json", "PAROISSE", "paroisses_index_phi3")
    index_dataset("ouvriers.json", "OUVRIER", "ouvriers_index_phi3")
