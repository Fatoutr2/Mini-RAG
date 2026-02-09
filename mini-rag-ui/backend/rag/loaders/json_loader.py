import os
import json
from typing import List, Dict, Any


def _flatten_text(obj: Any, texts: List[str]):
    """
    Extrait récursivement tout le texte utile d’un JSON
    """
    if isinstance(obj, dict):
        for v in obj.values():
            _flatten_text(v, texts)
    elif isinstance(obj, list):
        for item in obj:
            _flatten_text(item, texts)
    elif isinstance(obj, str):
        if obj.strip():
            texts.append(obj.strip())


def load_json(path: str) -> str:
    """
    Charge un JSON et retourne tout le texte concaténé
    """
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return ""

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Erreur lecture JSON {path}: {e}")
        return ""

    texts = []
    _flatten_text(data, texts)
    return " ".join(texts)


def load_json_as_chunks(path: str) -> List[Dict]:
    """
    Charge un JSON et le transforme en chunks RAG
    Compatible FAQ, objets, listes, JSON imbriqués
    """
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return []

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Erreur lecture JSON {path}: {e}")
        return []

    chunks = []

    # ✅ Cas FAQ : liste de questions / réponses
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                text = item.get("answer") or item.get("text")
                if isinstance(text, str) and text.strip():
                    chunks.append({
                        "text": text.strip(),
                        "type": "faq",
                        "source": os.path.basename(path)
                    })

    # ✅ Cas JSON classique / imbriqué
    else:
        texts = []
        _flatten_text(data, texts)
        if texts:
            chunks.append({
                "text": " ".join(texts),
                "type": "json",
                "source": os.path.basename(path)
            })

    return chunks
