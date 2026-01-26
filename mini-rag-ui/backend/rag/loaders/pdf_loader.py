import os
from PyPDF2 import PdfReader

def load_pdf(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return ""

    try:
        reader = PdfReader(path)
    except Exception:
        return ""

    text = ""
    for page in reader.pages:
        try:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
        except Exception:
            pass

    return text.strip()
