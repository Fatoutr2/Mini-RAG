import os
from docx import Document

def load_docx(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print(f"⚠️ Fichier vide ou inexistant : {path}")
        return ""

    try:
        doc = Document(path)
        text = " ".join(p.text for p in doc.paragraphs if p.text.strip())
        return text
    except Exception as e:
        print(f"❌ Erreur lors du chargement de {path}: {e}")
        return ""
