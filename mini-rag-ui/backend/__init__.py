from .rag import *
from .api import *
from .rag_engine import *
#from .cli import *
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


def load_all_documents(data_dir="data/documents"):
    documents = []

    # 1️⃣ Documents fichiers (txt, pdf, etc.)
    for file in os.listdir(data_dir):
        path = os.path.join(data_dir, file)
        if not os.path.isfile(path):
            continue

        file_docs = load_file(path)
        for i, text in enumerate(file_docs):
            documents.append({
                "text": text,
                "source": file,
                "type": "file",
                "already_chunked": False
            })

    # 2️⃣ Jobs depuis la base de données
    db_jobs = load_db_jobs()
    for i, text in enumerate(db_jobs):
        documents.append({
            "text": text,
            "source": f"db_job_{i+1}",
            "type": "db_job",
            "already_chunked": True
        })

    # 3️⃣ Projets depuis la base de données
    db_projects = load_db_projects()
    for i, text in enumerate(db_projects):
        documents.append({
            "text": text,
            "source": f"db_project_{i+1}",
            "type": "db_project",
            "already_chunked": True
        })

    return documents
