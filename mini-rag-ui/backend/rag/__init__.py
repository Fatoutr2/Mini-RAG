from .chunking import smart_chunk
from .embeddings import embed
from .retriever import retrieve
from .vectorstore import build_index
import os

from backend.rag.loaders.txt_loader import load_txt
from backend.rag.loaders.pdf_loader import load_pdf
from backend.rag.loaders.docx_loader import load_docx
from backend.rag.loaders.csv_loader import load_csv
from backend.rag.loaders.excel_loader import load_excel
from backend.rag.loaders.excel_loader import load_excel_as_chunks
from backend.rag.loaders.json_loader import load_json
from backend.rag.loaders.json_loader import load_json_as_chunks
from backend.rag.loaders.db_loader import load_db_jobs, load_db_projects


def load_file(path: str):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return []

    if path.endswith(".txt"):
        return load_txt(path)
    elif path.endswith(".pdf"):
        return load_pdf(path)
    elif path.endswith(".docx"):
        return load_docx(path)
    elif path.endswith(".csv"):
        return load_csv(path)
    elif path.endswith(".xls") or path.endswith(".xlsx"):
        return load_excel_as_chunks(path)
    elif path.endswith(".json"):
        return load_json_as_chunks(path)

    return []


def load_all_documents(data_dir: str):
    documents = []

    for file in os.listdir(data_dir):
        path = os.path.join(data_dir, file)

        if not os.path.isfile(path) or os.path.getsize(path) == 0:
            continue

        try:
            if file.endswith(".txt"):
                documents.append({
                    "text": load_txt(path),
                    "source": file,
                    "type": "txt"
                })

            elif file.endswith(".pdf"):
                documents.append({
                    "text": load_pdf(path),
                    "source": file,
                    "type": "pdf"
                })

            elif file.endswith(".docx"):
                documents.append({
                    "text": load_docx(path),
                    "source": file,
                    "type": "docx"
                })

            elif file.endswith(".csv"):
                documents.append({
                    "text": load_csv(path),
                    "source": file,
                    "type": "csv"
                })

            elif file.endswith(".xls") or file.endswith(".xlsx"):
                documents.extend(load_excel_as_chunks(path))
                
            elif file.endswith(".json"):
                documents.extend(load_json_as_chunks(path))



        except Exception as e:
            print(f"[WARN] {file} ignoré : {e}")

    # 🔹 Charger la base de données
    db_texts = load_db_jobs()
    for i, t in enumerate(db_texts):
        documents.append({
            "text": t,
            "source": f"db_job_{i+1}",
            "type": "db_job"
        })

    db_projects = load_db_projects()
    for i, t in enumerate(db_projects):
        documents.append({
            "text": t,
            "source": f"db_project_{i+1}",
            "type": "db_project"
        })
    return documents

