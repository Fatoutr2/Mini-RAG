from fastapi import Depends, FastAPI, HTTPException, Header
from pydantic import BaseModel
from .rag_engine import RAGEngine
from fastapi.middleware.cors import CORSMiddleware
from .auth.security import decode_access_token
from .utils import save_conversation, get_history
from .auth.routes import router as auth_router




app = FastAPI()
rag = RAGEngine()

class Query(BaseModel):
    question: str


def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = decode_access_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide")
    return user

@app.post("/query")
def query_rag(payload: Query, user=Depends(get_current_user)):
    history = get_history(user["id"])

    context_text = "\n".join(
        [f"Q: {h['question']}\nA: {h['answer']}" for h in history[-5:]]
    )

    prompt = f"{context_text}\nNouvelle question: {payload.question}"

    result = rag.ask(prompt)

    save_conversation(user["id"], payload.question, result["answer"])

    return {
        "answer": result["answer"],
        "context": result["context"]
    }


@app.post("/admin/add-document")
def add_doc(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    return {"message": "Admin autorisé"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)