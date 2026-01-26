import os
import pandas as pd

def load_csv(path: str) -> str:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return ""

    try:
        df = pd.read_csv(path)
    except Exception:
        try:
            df = pd.read_csv(path, sep=";")
        except Exception:
            return ""

    if df.empty:
        return ""

    return "\n".join(
        " | ".join(map(str, row.values))
        for _, row in df.iterrows()
    )
