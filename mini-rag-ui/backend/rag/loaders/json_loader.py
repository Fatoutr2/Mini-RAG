import os
import json

def load_json(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print(f"⚠️ Fichier JSON vide ou inexistant : {path}")
        return ""

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Erreur lecture JSON {path}: {e}")
        return ""

    texts = []

    def extract(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                extract(v)
        elif isinstance(obj, list):
            for item in obj:
                extract(item)
        else:
            texts.append(str(obj))

    extract(data)
    return " ".join(texts)
