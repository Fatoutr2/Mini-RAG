import os
import pandas as pd

def load_excel(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print(f"⚠️ Fichier Excel vide ou inexistant : {path}")
        return ""

    try:
        xls = pd.ExcelFile(path, engine="openpyxl")
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
