from langchain_community.embeddings import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="mistral", base_url="http://127.0.0.1:11434")
vector = embeddings.embed_query("test")

print(f"📐 Dimension produite par le modèle 'mistral' : {len(vector)}")
