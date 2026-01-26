import faiss
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from openai import OpenAI

from .rag.loaders import load_all_documents
from .rag.chunking import smart_chunk
from .rag.embeddings import embed
from .rag.vectorstore import build_index
from .rag.retriever import retrieve
from .rag.reranker import rerank
from .rag.prompt import build_prompt

load_dotenv()
print("🚀 OPENROUTER_API_KEY au démarrage :", os.getenv("OPENROUTER_API_KEY"))


api_key = os.getenv("OPENROUTER_API_KEY")

if not api_key:
    raise ValueError("❌ La clé OPENROUTER_API_KEY n'est pas définie dans l'environnement.")

client = OpenAI(
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mini-RAG-Entreprise"
    }
)

class RAGEngine:
    def __init__(self, data_dir="data/documents"):
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.documents = []
        self.chunks = []
        self.index = None

        self.load_data(data_dir)

    def load_data(self, data_dir):
        self.documents = load_all_documents(data_dir)
        print(f"📄 Documents chargés: {len(self.documents)}")

        for doc in self.documents:
            if not isinstance(doc, dict):
                print("❌ Document invalide:", type(doc))
                continue

            text = doc.get("text", "").strip()

            # Cas document vide
            if not text:
                self.chunks.append({
                    "text": "[Document vide ou très court]",
                    "type": doc.get("type", "unknown"),
                    "source": doc.get("source", "unknown")
                })
                continue

            # Découpage normal
            chunks = smart_chunk(doc)

            for c in chunks:
                # Sécurité ABSOLUE sur le format
                self.chunks.append({
                    "text": c.get("text", ""),
                    "type": c.get("type", doc.get("type", "unknown")),
                    "source": c.get("source", doc.get("source", "unknown"))
                })

        print(f"🧩 Total chunks générés: {len(self.chunks)}")

        texts = [c["text"] for c in self.chunks]
        embeddings = embed(texts)
        self.index = build_index(embeddings)

    def ask(self, question):
        retrieved = retrieve(
            question,
            self.index,
            self.chunks,
            top_k=20
        )

        if not retrieved:
            return {
                "answer": "Information non disponible dans les documents.",
                "context": []
            }

        reranked = rerank(question, retrieved, self.embedder)

        # Normalisation du contexte
        context_chunks = []
        for r in reranked:
            context_chunks.append({
                "text": r.get("text", ""),
                "type": r.get("type", "unknown"),
                "source": r.get("source", "unknown")
            })

        # 🔹 Construire le PROMPT
        prompt = build_prompt(context_chunks, question)

        # 🔹 Appel OpenRouter
        response = client.responses.create(
            model="openai/gpt-4o-mini",
            input=prompt,
            temperature=0.2,
        )

        answer = response.output_text

        # 🔹 Retour API
        return {
            "answer": answer,
            "context": context_chunks
        }
