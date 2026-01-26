from sentence_transformers import SentenceTransformer
import numpy as np

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed(texts):
    """
    texts : List[str]
    """
    if not texts or not isinstance(texts[0], str):
        raise ValueError("embed() attend une liste de strings")

    model = get_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )
    return embeddings.astype("float32")


def embed_query(query):
    return embed([query])[0].reshape(1, -1)
