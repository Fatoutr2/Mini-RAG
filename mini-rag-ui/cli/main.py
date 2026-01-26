import argparse
from backend.rag_engine import RAGEngine

rag = RAGEngine()

parser = argparse.ArgumentParser()
parser.add_argument("question", help="Question à poser au RAG")
args = parser.parse_args()

results = rag.ask(args.question)

if not results:
    print("❌ Aucun résultat")
else:
    print("\n".join(results))
