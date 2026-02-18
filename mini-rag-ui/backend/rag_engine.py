import os
import re
from pathlib import Path
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from .rag.loaders import load_all_documents, load_db_jobs, load_db_projects, load_file
from .rag.chunking import smart_chunk
from .rag.embeddings import embed
from .rag.vectorstore import build_index
from .rag.retriever import retrieve
from .rag.reranker import rerank
from .rag.prompt import build_prompt
from .rag.social import detect_social_intent, social_response, is_pure_social_message
from .llm_client import create_response

# =========================
# ENV & CLIENT
# =========================
load_dotenv()

# =========================
# RAG ENGINE SÛR
# =========================
class RAGEngine:
    def __init__(self, public_dir="data/public", private_dir="data/private"):
        base_dir = Path(__file__).resolve().parents[1]
        self.public_dir = Path(public_dir)
        self.private_dir = Path(private_dir)
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.public_chunks = []
        self.private_chunks = []
        self.public_index = None
        self.private_index = None

        # Chargement des données
        self.load_public_data(public_dir)
        if os.path.exists(private_dir):
            self.load_private_data(private_dir)

    def _is_full_file_request(self, question: str) -> bool:
        q = (question or "").lower()
        markers = [
            "fichier entier",
            "fichier complet",
            "contenu complet",
            "en entier",
            "intégral",
            "integral",
            "tout le fichier",
            "donne-moi le fichier",
        ]
        return any(m in q for m in markers)

    def _is_followup_question(self, question: str) -> bool:
        q = (question or "").strip().lower()
        followup_markers = [
            "et ",
            "et sur",
            "et pour",
            "et ce projet",
            "et celui",
            "lui",
            "celle-ci",
        ]
        return any(q.startswith(marker) for marker in followup_markers)

    def _extract_topic_from_question(self, question: str) -> str:
        q = (question or "").strip()
        if not q:
            return ""

        patterns = [
            r"projet\s+([\w\-]+)",
            r"sur\s+(?:le\s+projet\s+)?([\w\-]+)",
            r"concernant\s+([\w\-]+)",
        ]

        for pattern in patterns:
            m = re.search(pattern, q, flags=re.IGNORECASE)
            if m:
                return (m.group(1) or "").strip(" .?!,;:")

        return ""

    def _contextualize_question(self, question: str, history_user_questions=None) -> str:
        """
        Recompose une question suivie (ex: "et sur jobmatchai ?")
        à partir de la dernière intention utilisateur explicite.
        """
        if not self._is_followup_question(question):
            return question

        history_user_questions = history_user_questions or []
        if not history_user_questions:
            return question

        # On prend la dernière question utilisateur significative.
        previous = (history_user_questions[-1] or "").strip()
        if not previous:
            return question

        # Résolution de références vagues "ça / ceci / ce projet"
        q_low = question.lower()
        has_vague_reference = any(token in q_low for token in [" ça", "ça", "cela", "ce projet", "celui", "celle-ci", "dessus"])
        if has_vague_reference:
            last_topic = self._extract_topic_from_question(previous)
            if last_topic:
                if "qui travaille" in q_low:
                    return f"Qui travaille sur le projet {last_topic} ?"
                if "en plus" in q_low or "plus" in q_low:
                    return f"Donne-moi plus de détails sur le projet {last_topic}."
                return f"{question.strip()} sur le projet {last_topic}"

        # Si la nouvelle question contient déjà le verbe d'intention, on garde tel quel.
        if any(v in q_low for v in ["qui travaille", "qui est", "combien", "quand", "où", "comment"]):
            return question

        # Hérite d'une intention explicite de type "qui travaille ..."
        prev_low = previous.lower()
        if "qui travaille" in prev_low:
            return f"Qui travaille {question.strip()}"
        if "qui est" in prev_low:
            return f"Qui est concerné {question.strip()}"

        return f"En tenant compte de la question précédente: {question.strip()}"

    def _iter_data_files(self):
        for data_dir in [self.private_dir, self.public_dir]:
            if not data_dir.exists():
                continue
            for file_path in data_dir.iterdir():
                if file_path.is_file():
                    yield file_path

    def _find_file_path(self, question: str, prefer_private: bool = True):
        # 1) Essayer un nom de fichier explicite dans la question
        pattern = r"([\w\-. ]+\.(?:txt|pdf|docx|csv|json|xls|xlsx|md))"
        matched = re.findall(pattern, question or "", flags=re.IGNORECASE)
        if matched:
            requested = matched[0].strip().lower()
            candidates = []
            for p in self._iter_data_files():
                if p.name.lower() == requested:
                    candidates.append(p)
            if candidates:
                if prefer_private:
                    candidates.sort(key=lambda p: 0 if "private" in str(p) else 1)
                return candidates[0]

        # 2) Fallback: trouver un fichier dont le nom est mentionné partiellement
        q = (question or "").lower()
        best = None
        best_score = 0
        for p in self._iter_data_files():
            stem = p.stem.lower()
            name = p.name.lower()
            score = 0
            if name in q:
                score = len(name)
            elif stem in q:
                score = len(stem)
            if score > best_score:
                best_score = score
                best = p
        return best

    def _load_full_file_text(self, file_path: Path) -> str:
        loaded = load_file(str(file_path))
        if isinstance(loaded, str):
            return loaded.strip()
        if isinstance(loaded, list):
            parts = []
            for item in loaded:
                if isinstance(item, str) and item.strip():
                    parts.append(item.strip())
                elif isinstance(item, dict):
                    text = item.get("text") or item.get("answer") or ""
                    if isinstance(text, str) and text.strip():
                        parts.append(text.strip())
            return "\n\n".join(parts).strip()
        return ""


    def refresh_data(self, visibility: str = "private"):
        normalized = (visibility or "private").strip().lower()

        if normalized == "public":
            self.load_public_data(str(self.public_dir))
            return

        if normalized == "private":
            self.load_private_data(str(self.private_dir))
            return

        raise ValueError("visibility must be 'public' or 'private'")

    def _get_files_context(self, file_names, max_chars_per_file: int = 12000) -> str:
        if not file_names:
            return ""

        blocks = []
        for file_name in file_names:
            if not isinstance(file_name, str) or not file_name.strip():
                continue

            safe_name = os.path.basename(file_name.strip())
            found = None
            for p in self._iter_data_files():
                if p.name == safe_name:
                    found = p
                    break

            if not found:
                blocks.append(f"[FICHIER INTROUVABLE] {safe_name}")
                continue

            text = self._load_full_file_text(found)
            if not text:
                blocks.append(f"[FICHIER ILLISIBLE OU VIDE] {safe_name}")
                continue

            truncated = False
            if len(text) > max_chars_per_file:
                text = text[:max_chars_per_file]
                truncated = True

            suffix = "\n[NOTE: contenu tronqué pour limite de contexte]" if truncated else ""
            blocks.append(f"[FICHIER: {safe_name}]\n{text}{suffix}")

        return "\n\n".join(blocks)

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

        # Jobs
        db_texts = load_db_jobs()
        for i, t in enumerate(db_texts):
            documents.append({
                "text": t,
                "source": f"db_job_{i+1}",
                "type": "db_job",
                "already_chunked": True
            })

        # 🔹 Projets
        db_projects = load_db_projects()
        for i, t in enumerate(db_projects):
            documents.append({
                "text": t,
                "source": f"db_project_{i+1}",
                "type": "db_project",
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
        if is_pure_social_message(question, intent):
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

        response = create_response(prompt, temperature=0.1)
        return response.output_text.strip() or "Je n'ai pas cette information 😔"

    # =========================
    # ASK PRIVATE
    # =========================
    def ask(self, question: str, file_names=None, history_user_questions=None):

        question = self._contextualize_question(question, history_user_questions)

        intent = detect_social_intent(question)
        if is_pure_social_message(question, intent):
            return social_response(intent)
        
        if self._is_full_file_request(question):
            full_file_path = self._find_file_path(question)

            if not full_file_path and file_names:
                first_name = os.path.basename((file_names[0] or "").strip())
                for p in self._iter_data_files():
                    if p.name == first_name:
                        full_file_path = p
                        break

            if full_file_path:
                full_text = self._load_full_file_text(full_file_path)
                if full_text:
                    return (
                        f"Voici le contenu intégral de **{full_file_path.name}** :\n\n"
                        f"```text\n{full_text}\n```"
                    )

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
        response = create_response(prompt, temperature=0.1)
        return response.output_text.strip() or "Je n'ai pas cette information 😔"
    
    

    # =========================
    # ASK CHAT (LLM PUR)
    # =========================
    def ask_chat(self, question: str, file_names=None, history_user_questions=None):
        question = self._contextualize_question(question, history_user_questions)
        intent = detect_social_intent(question)
        if is_pure_social_message(question, intent):
            return social_response(intent)

        files_context = self._get_files_context(file_names or [])

        system_prompt = (
            "Tu es SmartIA Assistant, un assistant conversationnel général en français. "
            "Réponds de façon claire, utile et concise. "
            "Si l'utilisateur demande du code, donne une réponse structurée et pratique."
            "Si des fichiers sont fournis, considère que leur contenu est disponible dans le contexte. "
            "N'affirme jamais que tu ne peux pas accéder aux fichiers si du contexte fichier est présent ; "
            "utilise ce contexte explicitement dans ta réponse."
        )

        user_content = question
        if files_context:
            user_content = (
                f"Question utilisateur:\n{question}\n\n"
                f"Contexte fichiers fournis:\n{files_context}"
            )

        response = create_response([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ], temperature=0.4)

        return response.output_text.strip() or "Je n'ai pas pu générer de réponse pour le moment."
