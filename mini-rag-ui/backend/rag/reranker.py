from sentence_transformers import util

def rerank(question, chunks, embedder):
    texts = [c["text"] for c in chunks]

    q_emb = embedder.encode(question, convert_to_tensor=True)
    c_emb = embedder.encode(texts, convert_to_tensor=True)

    scores = util.cos_sim(q_emb, c_emb)[0]

    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True
    )

    # 🔑 On retourne UNIQUEMENT les chunks
    return [chunk for chunk, score in ranked]
