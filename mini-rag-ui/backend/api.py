import os
import time
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query as FastQuery, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .audit import log_admin_action
from .auth.routes import router as auth_router
from .auth.security import get_current_user
from .bootstrap import ensure_schema
from .metrics import inc_route, inc_route_error, route_timer, snapshot_metrics
from .rag_engine import RAGEngine
from .utils import (
    append_message_and_answer,
    create_thread,
    delete_thread,
    get_thread_messages,
    list_threads,
    rename_thread,
    set_thread_mode,
)

app = FastAPI()
rag = RAGEngine()
BASE_DIR = Path(__file__).resolve().parents[1]


class Query(BaseModel):
    question: str


class AskPayload(BaseModel):
    question: str


class RenamePayload(BaseModel):
    title: str


class ModePayload(BaseModel):
    mode: str


class RenameFilePayload(BaseModel):
    new_name: str


@app.on_event("startup")
def on_startup():
    ensure_schema()


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    path = request.url.path
    inc_route(path)
    with route_timer(path):
        try:
            return await call_next(request)
        except Exception:
            inc_route_error(path)
            raise


@app.get("/metrics")
def get_metrics(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    return snapshot_metrics()


@app.get("/public/company-info")
def company_info():
    return {"name": "Mini RAG", "description": "Assistant intelligent basé sur RAG", "contact": "contact@rag.ai"}


@app.post("/query")
def query_rag(payload: Query, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")

    answer = rag.ask(payload.question)
    return {"answer": answer, "source": "rag"}


@app.get("/conversations/me")
def get_my_threads(search: str = FastQuery(default=""), user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return list_threads(user["user_id"], search=search)


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

    if user["role"] == "admin":
        log_admin_action(user["user_id"], "upload_file", target=f"{normalized_visibility}/{filename}")

    return {
        "message": "Fichier déposé",
        "path": str(destination.relative_to(BASE_DIR)),
        "visibility": normalized_visibility,
        "filename": filename,
    }


@app.get("/admin/files")
def list_uploaded_files(visibility: str = FastQuery("private"), user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    normalized = visibility.strip().lower()
    if normalized not in {"public", "private"}:
        raise HTTPException(400, "visibility invalide")

    target_dir = BASE_DIR / "data" / normalized
    target_dir.mkdir(parents=True, exist_ok=True)

    files = []
    for p in sorted(target_dir.iterdir()):
        if p.is_file():
            files.append({"name": p.name, "size": p.stat().st_size, "updated_at": p.stat().st_mtime})
    return {"visibility": normalized, "files": files}


@app.delete("/admin/files/{visibility}/{filename}")
def delete_uploaded_file(visibility: str, filename: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    normalized = visibility.strip().lower()
    if normalized not in {"public", "private"}:
        raise HTTPException(400, "visibility invalide")

    safe_name = os.path.basename(filename)
    path = BASE_DIR / "data" / normalized / safe_name
    if not path.exists() or not path.is_file():
        raise HTTPException(404, "Fichier introuvable")

    path.unlink()
    log_admin_action(user["user_id"], "delete_file", target=f"{normalized}/{safe_name}")
    return {"ok": True}


@app.patch("/admin/files/{visibility}/{filename}")
def rename_uploaded_file(visibility: str, filename: str, payload: RenameFilePayload, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    normalized = visibility.strip().lower()
    if normalized not in {"public", "private"}:
        raise HTTPException(400, "visibility invalide")

    old_name = os.path.basename(filename)
    new_name = os.path.basename(payload.new_name or "")
    if not new_name:
        raise HTTPException(400, "Nom de fichier invalide")

    src = BASE_DIR / "data" / normalized / old_name
    dst = BASE_DIR / "data" / normalized / new_name
    if not src.exists() or not src.is_file():
        raise HTTPException(404, "Fichier introuvable")
    if dst.exists():
        raise HTTPException(409, "Un fichier avec ce nom existe déjà")

    src.rename(dst)
    log_admin_action(user["user_id"], "rename_file", target=f"{normalized}/{old_name}", details=f"new={new_name}")
    return {"ok": True, "filename": new_name}


@app.post("/admin/reindex")
def reindex_documents(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    rag.load_public_data(str(BASE_DIR / "data" / "public"))
    rag.load_private_data(str(BASE_DIR / "data" / "private"))
    log_admin_action(user["user_id"], "reindex")
    return {"ok": True, "message": "Index reconstruit"}

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


@app.post("/rag/visitor")
def rag_visitor(payload: Query):

    answer = rag.ask_public(payload.question)
    return {"answer": answer, "source": "rag"}


@app.post("/conversations")
def create_conversation(user=Depends(get_current_user), mode: str = FastQuery(default="rag")):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    normalized_mode = (mode or "rag").strip().lower()
    if normalized_mode not in {"rag", "chat"}:
        raise HTTPException(400, "mode invalide")

    return create_thread(user["user_id"], "Nouveau chat", mode=normalized_mode)


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


@app.patch("/conversations/{thread_id}/mode")
def patch_conversation_mode(thread_id: int, payload: ModePayload, user=Depends(get_current_user)):
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")
    return set_thread_mode(user["user_id"], thread_id, payload.mode)


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
    set_thread_mode(user["user_id"], thread_id, "rag")
    return {"answer": answer, "source": "rag"}


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
    set_thread_mode(user["user_id"], thread_id, "rag")
    return {"answer": answer, "source": "rag"}


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
    set_thread_mode(user["user_id"], thread_id, "chat")
    return {"answer": answer, "source": "chat"}


origins_env = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allow_origins = [o.strip() for o in origins_env.split(",") if o.strip()]

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
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
