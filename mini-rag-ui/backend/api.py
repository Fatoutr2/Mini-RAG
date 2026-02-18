import os
import time
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, APIRouter, Query as FastQuery, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .rag_engine import RAGEngine
from .auth.security import get_current_user
from .utils import save_conversation, get_history
from .utils import (
    save_conversation, 
    get_history,
    create_thread,
    list_threads,
    get_thread_messages,
    rename_thread,
    delete_thread,
    append_message_and_answer,
)
from .auth.routes import router as auth_router

app = FastAPI()
rag = RAGEngine()
BASE_DIR = Path(__file__).resolve().parents[1]

class Query(BaseModel):
    question: str

class AskPayload(BaseModel):
    question: str
    file_names: Optional[List[str]] = None

class RenamePayload(BaseModel):
    title: str


class RenameFilePayload(BaseModel):
    new_name: str

# -------- PUBLIC ROUTES (VISITOR) --------
@app.get("/public/company-info")
def company_info():
    return {"name": "Mini RAG", "description": "Assistant intelligent basé sur RAG", "contact": "contact@rag.ai"}

# -------- RAG (MEMBER / ADMIN) --------
@app.post("/query")
def query_rag(payload: Query, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")

    answer = rag.ask(payload.question)
    save_conversation(user["user_id"], payload.question, answer)

    return {"answer": answer}

@app.get("/conversations/me")
def get_my_threads(search: str = FastQuery(default=""), user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return list_threads(user["user_id"], search=search)


# -------- ADMIN --------
@app.post("/admin/add-document")
def add_doc(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    return {"message": "Admin autorisé"}


@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    visibility: str = Form("private"),
    user=Depends(get_current_user),
):
    if user["role"] not in ["member", "admin"]:
        raise HTTPException(403, "Connexion requise")

    normalized_visibility = (visibility or "private").strip().lower()
    if normalized_visibility not in ["public", "private"]:
        raise HTTPException(400, "visibility doit être 'public' ou 'private'")

    if normalized_visibility == "public" and user["role"] != "admin":
        raise HTTPException(403, "Seul un admin peut déposer un fichier public")

    filename = os.path.basename(file.filename or "")
    if not filename:
        raise HTTPException(400, "Nom de fichier invalide")

    target_dir = BASE_DIR / "data" / normalized_visibility
    target_dir.mkdir(parents=True, exist_ok=True)
    destination = target_dir / filename

    content = await file.read()
    destination.write_bytes(content)

    try:
        rag.refresh_data(normalized_visibility)
    except Exception as exc:
        raise HTTPException(500, f"Fichier déposé mais indexation échouée: {exc}")

    return {
        "message": "Fichier déposé et indexé",
        "path": str(destination.relative_to(BASE_DIR)),
        "visibility": normalized_visibility,
        "filename": filename,
    }



@app.get("/admin/files")
def list_admin_files(
    visibility: str = FastQuery(default="private"),
    user=Depends(get_current_user),
):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    normalized_visibility = (visibility or "private").strip().lower()
    if normalized_visibility not in ["public", "private"]:
        raise HTTPException(400, "visibility doit être 'public' ou 'private'")

    target_dir = BASE_DIR / "data" / normalized_visibility
    target_dir.mkdir(parents=True, exist_ok=True)

    files = []
    for file_path in sorted(target_dir.iterdir(), key=lambda p: p.name.lower()):
        if not file_path.is_file():
            continue
        stats = file_path.stat()
        files.append({
            "filename": file_path.name,
            "visibility": normalized_visibility,
            "size": stats.st_size,
            "updated_at": int(stats.st_mtime),
        })

    return {"files": files}


@app.delete("/admin/files/{visibility}/{filename}")
def delete_admin_file(visibility: str, filename: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    normalized_visibility = (visibility or "").strip().lower()
    if normalized_visibility not in ["public", "private"]:
        raise HTTPException(400, "visibility doit être 'public' ou 'private'")

    safe_name = os.path.basename(filename or "")
    if not safe_name:
        raise HTTPException(400, "Nom de fichier invalide")

    target_dir = BASE_DIR / "data" / normalized_visibility
    file_path = target_dir / safe_name

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(404, "Fichier introuvable")

    file_path.unlink()

    try:
        rag.refresh_data(normalized_visibility)
    except Exception as exc:
        raise HTTPException(500, f"Fichier supprimé mais réindexation échouée: {exc}")

    return {
        "message": "Fichier supprimé et index mis à jour",
        "visibility": normalized_visibility,
        "filename": safe_name,
    }


@app.patch("/admin/files/{visibility}/{filename}")
def rename_admin_file(
    visibility: str,
    filename: str,
    payload: RenameFilePayload,
    user=Depends(get_current_user),
):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    normalized_visibility = (visibility or "").strip().lower()
    if normalized_visibility not in ["public", "private"]:
        raise HTTPException(400, "visibility doit être 'public' ou 'private'")

    old_name = os.path.basename(filename or "")
    new_name = os.path.basename((payload.new_name or "").strip())
    if not old_name or not new_name:
        raise HTTPException(400, "Nom de fichier invalide")

    target_dir = BASE_DIR / "data" / normalized_visibility
    src = target_dir / old_name
    dst = target_dir / new_name

    if not src.exists() or not src.is_file():
        raise HTTPException(404, "Fichier introuvable")

    if dst.exists():
        raise HTTPException(409, "Un fichier avec ce nom existe déjà")

    src.rename(dst)

    try:
        rag.refresh_data(normalized_visibility)
    except Exception as exc:
        raise HTTPException(500, f"Fichier renommé mais réindexation échouée: {exc}")

    return {
        "message": "Fichier renommé et index mis à jour",
        "visibility": normalized_visibility,
        "old_filename": old_name,
        "filename": new_name,
    }


# -------- VISTOR --------
@app.post("/rag/visitor")
def rag_visitor(payload: Query):
    """
    RAG public – PAS D'AUTH
    """
    answer = rag.ask_public(payload.question)
    return {"answer": answer}


@app.post("/conversations")
def create_conversation(user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return create_thread(user["user_id"], "Nouveau chat")



@app.get("/conversations/{thread_id}/messages")
def get_messages(thread_id: int, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return get_thread_messages(user["user_id"], thread_id)


@app.patch("/conversations/{thread_id}")
def patch_conversation(thread_id: int, payload: RenamePayload, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return rename_thread(user["user_id"], thread_id, payload.title)


@app.delete("/conversations/{thread_id}")
def remove_conversation(thread_id: int, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return delete_thread(user["user_id"], thread_id)


@app.post("/conversations/{thread_id}/messages")
def send_message(thread_id: int, payload: AskPayload, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")

    messages = get_thread_messages(user["user_id"], thread_id)
    history_user_questions = [m["content"] for m in messages if m.get("role") == "user"]

    answer = rag.ask(
        payload.question,
        file_names=payload.file_names or [],
        history_user_questions=history_user_questions,
    )
    append_message_and_answer(
        user_id=user["user_id"],
        thread_id=thread_id,
        question=payload.question,
        answer=answer,
    )
    return {"answer": answer}


@app.post("/conversations/{thread_id}/messages/rag")
def send_message_rag(thread_id: int, payload: AskPayload, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")

    messages = get_thread_messages(user["user_id"], thread_id)
    history_user_questions = [m["content"] for m in messages if m.get("role") == "user"]

    answer = rag.ask(
        payload.question,
        file_names=payload.file_names or [],
        history_user_questions=history_user_questions,
    )
    append_message_and_answer(
        user_id=user["user_id"],
        thread_id=thread_id,
        question=payload.question,
        answer=answer,
    )
    return {"answer": answer}


@app.post("/conversations/{thread_id}/messages/chat")
def send_message_chat(thread_id: int, payload: AskPayload, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")

    messages = get_thread_messages(user["user_id"], thread_id)
    history_user_questions = [m["content"] for m in messages if m.get("role") == "user"]

    answer = rag.ask_chat(
        payload.question,
        file_names=payload.file_names or [],
        history_user_questions=history_user_questions,
    )
    append_message_and_answer(
        user_id=user["user_id"],
        thread_id=thread_id,
        question=payload.question,
        answer=answer,
    )
    return {"answer": answer}


# -------- MIDDLEWARE --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)