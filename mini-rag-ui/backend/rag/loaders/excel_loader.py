import os
import pandas as pd
from typing import List, Dict

def load_excel(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print(f"⚠️ Fichier Excel vide ou inexistant : {path}")
        return ""

    ext = os.path.splitext(path)[1].lower()
    engine = "openpyxl" if ext == ".xlsx" else "xlrd"

    try:
        xls = pd.ExcelFile(path, engine=engine)
    except Exception as e:
        print(f"❌ Erreur ouverture Excel {path}: {e}")
        return ""

    text = ""
    for sheet in xls.sheet_names:
        try:
            df = xls.parse(sheet)
            if df.empty:
                continue
            text += "\n".join(
                " | ".join(map(str, row.values))
                for _, row in df.iterrows()
            )
        except Exception as e:
            print(f"⚠️ Erreur lecture feuille {sheet} dans {path}: {e}")
            continue

    return text


def load_excel_as_chunks(path: str) -> List[Dict]:
    chunks = []

    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return chunks

    try:
        xls = pd.ExcelFile(path, engine="openpyxl")
    except Exception as e:
        print(f"❌ Erreur ouverture Excel {path}: {e}")
        return chunks
        
    for sheet in xls.sheet_names:
        try:
            df = xls.parse(sheet)
            if df.empty:
                continue

            for _, row in df.iterrows():
                # Exemple lisible pour le modèle
                text = f"{row['Employé']} travaille comme {row['Rôle']} sur {row['Projet']} en utilisant {row['Technologie principale']}"
                chunks.append({
                    "text": text,
                    "type": "excel",
                    "source": os.path.basename(path)
                })


        except Exception as e:
            print(f"⚠️ Erreur lecture feuille {sheet} dans {path}: {e}")
            continue

    print(f"✅ {len(chunks)} chunks créés depuis {path}")
    return chunks
