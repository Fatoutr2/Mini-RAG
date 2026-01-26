# backend/rag/retriever.py
from .embeddings import embed_query

def retrieve(query, index, chunks, top_k=5):
    q_vec = embed_query(query)
    scores, indices = index.search(q_vec, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < len(chunks):
            results.append({
                "text": chunks[idx],
                "score": float(score)
            })

    return results
