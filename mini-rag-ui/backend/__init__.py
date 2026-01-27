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
from backend.rag.loaders.db_loader import load_db_jobs


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

    for file in os.listdir(data_dir):
        path = os.path.join(data_dir, file)
        documents.extend(load_file(path))

    documents.extend(load_db_jobs())

    return documents
