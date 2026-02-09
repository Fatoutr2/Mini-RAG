import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from openai import OpenAI

from .rag.loaders import load_all_documents, load_db_jobs
from .rag.chunking import smart_chunk
from .rag.embeddings import embed
from .rag.vectorstore import build_index
from .rag.retriever import retrieve
from .rag.reranker import rerank
from .rag.prompt import build_prompt
from .rag.social import detect_social_intent, social_response

# =========================
# ENV & CLIENT
# =========================
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("❌ La clé OPENROUTER_API_KEY n'est pas définie.")

client = OpenAI(
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Mini-RAG-Entreprise"
    }
)

# =========================
# RAG ENGINE SÛR
# =========================
class RAGEngine:
    def __init__(self, public_dir="data/public", private_dir="data/private"):
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.public_chunks = []
        self.private_chunks = []
        self.public_index = None
        self.private_index = None

        # Chargement des données
        self.load_public_data(public_dir)
        if os.path.exists(private_dir):
            self.load_private_data(private_dir)

    # =========================
    # PUBLIC
    # =========================
    def load_public_data(self, data_dir):
        documents = load_all_documents(data_dir)
        self.public_chunks = self._process_documents(documents)

        if not self.public_chunks:
            print("⚠️ Aucun chunk public trouvé")
            return

        texts = [c["text"] for c in self.public_chunks if c.get("text")]
        embeddings = embed(texts)
        self.public_index = build_index(embeddings)

        print("🔎 EXEMPLE CHUNKS PUBLICS :")
        for c in self.public_chunks[:5]:
            print("-", c["text"][:120])

        print(f"🌍 RAG PUBLIC prêt ({len(self.public_chunks)} chunks)")

    # =========================
    # PRIVATE
    # =========================
    def load_private_data(self, data_dir):
        documents = load_all_documents(data_dir)
        db_texts = load_db_jobs()
        for i, t in enumerate(db_texts):
            documents.append({
                "text": t,
                "source": f"db_job_{i+1}",
                "type": "db_job",
                "already_chunked": True
            })

        self.private_chunks = self._process_documents(documents)

        if not self.private_chunks:
            print("⚠️ Aucun chunk privé trouvé")
            return

        texts = [c["text"] for c in self.private_chunks if c.get("text")]
        embeddings = embed(texts)
        self.private_index = build_index(embeddings)

        print(f"🔐 RAG PRIVÉ prêt ({len(self.private_chunks)} chunks)")

    # =========================
    # PROCESS DOCUMENTS
    # =========================
    def _process_documents(self, documents):
        chunks = []
        for doc in documents:
            if isinstance(doc, list):
                for item in doc:
                    if isinstance(item, dict):
                        answer_str = self._normalize_text(item.get("answer", ""))
                        if answer_str:
                            chunks.append({"text": answer_str, "type": "faq", "source": "faq"})
            elif isinstance(doc, dict) and doc.get("already_chunked"):
                text = self._normalize_text(doc.get("text", ""))
                if text:
                    chunks.append({"text": text, "type": doc.get("type", "chunked"), "source": doc.get("source", "unknown")})
            elif isinstance(doc, dict):
                for c in smart_chunk(doc):
                    text = self._normalize_text(c.get("text", ""))
                    if text:
                        chunks.append({"text": text, "type": c.get("type", doc.get("type", "doc")), "source": c.get("source", doc.get("source", "unknown"))})
        return chunks

    def _normalize_text(self, text):
        if isinstance(text, str):
            return text.strip()
        elif isinstance(text, dict):
            return " ".join(str(v) for v in text.values()).strip()
        elif isinstance(text, list):
            return " ".join(str(v) for v in text).strip()
        return ""

    # =========================
    # ASK PUBLIC
    # =========================
    def ask_public(self, question: str):

        intent = detect_social_intent(question)
        if intent:
            return social_response(intent)

        if not self.public_chunks:
            return "Je n'ai pas cette information 😔"

        # 🔹 Récupération via retriever
        retrieved = retrieve(question, self.public_index, self.public_chunks, top_k=5)

        # 🔹 Extraire uniquement les textes sûrs
        texts = []
        for r in retrieved:
            if isinstance(r, dict):
                t = r.get("text", "")
                if isinstance(t, str) and t.strip():
                    texts.append(t.strip())
            elif isinstance(r, str) and r.strip():
                texts.append(r.strip())

        # 🔹 Si retriever ne trouve rien, fallback sur tous les chunks publics
        if not texts:
            texts = [c["text"] for c in self.public_chunks if isinstance(c.get("text"), str)]

        prompt = (
            "Tu es un assistant virtuel de l'entreprise SmartIA.\n"
            "Réponds à la question suivante en utilisant le CONTEXTE.\n"
            "Si la réponse n'est pas dans le contexte, répond simplement : 'Je n'ai pas cette information 😔'.\n\n"
            "CONTEXTE :\n"
            + "\n\n".join(texts)
            + f"\n\nQUESTION : {question}\nRÉPONSE :"
        )

        response = client.responses.create(
            model="openai/gpt-4o-mini",
            input=prompt,
            temperature=0.1
        )
        return response.output_text.strip() or "Je n'ai pas cette information 😔"

    # =========================
    # ASK PRIVATE
    # =========================
    def ask(self, question: str):

        intent = detect_social_intent(question)
        if intent:
            return social_response(intent)
        
        if not self.private_chunks:
            return "Je n'ai pas cette information 😔"

        retrieved = retrieve(question, self.private_index, self.private_chunks, top_k=20)
        if not retrieved:
            return "Je n'ai pas cette information 😔"

        reranked = rerank(question, retrieved, self.embedder)
        if not reranked:
            return "Je n'ai pas cette information 😔"

        print("DEBUG chunk:", reranked[0])

        prompt = build_prompt(reranked, question)
        response = client.responses.create(model="openai/gpt-4o-mini", input=prompt, temperature=0.1)
        return response.output_text.strip() or "Je n'ai pas cette information 😔"
