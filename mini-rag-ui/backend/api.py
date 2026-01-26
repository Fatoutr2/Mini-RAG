from fastapi import FastAPI
from pydantic import BaseModel
from .rag_engine import RAGEngine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
rag = RAGEngine()

class Query(BaseModel):
    question: str

@app.post("/query")
def query_rag(payload: Query):
    result = rag.ask(payload.question)

    if not result:
        return {"answer": None, "context": []}

    return {
        "answer": result["answer"],      # ✅ accès correct
        "context": result["context"]     # ✅ accès correct
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
