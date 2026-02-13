from fastapi import Depends, FastAPI, HTTPException, APIRouter, Query as FastQuery, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
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

class RenamePayload(BaseModel):
    title: str

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

    return {
        "message": "Fichier déposé",
        "path": str(destination.relative_to(BASE_DIR)),
        "visibility": normalized_visibility,
        "filename": filename,
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

    answer = rag.ask(payload.question)
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

    answer = rag.ask(payload.question)
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

    answer = rag.ask_chat(payload.question)
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
