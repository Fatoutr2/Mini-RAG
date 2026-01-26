import os

def load_txt(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return ""

    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(path, "r", encoding="latin-1") as f:
            return f.read()
    except Exception:
        return ""
