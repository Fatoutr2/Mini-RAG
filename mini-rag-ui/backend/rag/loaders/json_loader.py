import os
import json
from typing import List, Dict

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

def load_json_as_chunks(path: str) -> List[Dict]:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return []

    import json
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Transformation de tout en texte lisible
    text = (
        f"{data['company']} utilise {data['default_backend']} pour le backend, "
        f"{data['default_frontend']} pour le frontend, "
        f"{data['cloud_provider']} pour le cloud. "
        f"CI/CD: {data['ci_cd']}, code review: {data['security']['code_review_required']}, "
        f"tests: {data['security']['tests_required']}"
    )

    return [{
        "text": text,
        "type": "json",
        "source": os.path.basename(path)
    }]

