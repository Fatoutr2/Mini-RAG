from fastapi import Depends, FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from .rag_engine import RAGEngine
from .auth.security import get_current_user
from .utils import save_conversation, get_history
from .auth.routes import router as auth_router

app = FastAPI()
rag = RAGEngine()

class Query(BaseModel):
    question: str

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
def get_my_conversations(user=Depends(get_current_user)):
    """
    Renvoie toutes les conversations du membre connecté
    """
    if user["role"] == "visitor":
        raise HTTPException(403, "Connexion requise")

    history = get_history(user["user_id"])

    return [
        {"id": h.get("id"), "question": h["question"], "answer": h["answer"], "created_at": h.get("created_at")}
        for h in history
    ]


# -------- ADMIN --------
@app.post("/admin/add-document")
def add_doc(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")
    return {"message": "Admin autorisé"}


# -------- VISTOR --------
@app.post("/rag/visitor")
def rag_visitor(payload: Query):
    """
    RAG public – PAS D'AUTH
    """
    answer = rag.ask_public(payload.question)
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
