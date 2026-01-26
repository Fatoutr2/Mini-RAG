import os
from .txt_loader import load_txt
from .pdf_loader import load_pdf
from .docx_loader import load_docx
from .csv_loader import load_csv
from .excel_loader import load_excel
from .json_loader import load_json
from .db_loader import load_db_jobs


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
        return load_excel(path)
    elif path.endswith(".json"):
        return load_json(path)

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
                documents.append({
                    "text": load_excel(path),
                    "source": file,
                    "type": "excel"
                })

            elif file.endswith(".json"):
                documents.append({
                    "text": load_json(path),
                    "source": file,
                    "type": "json"
                })

        except Exception as e:
            print(f"[WARN] {file} ignoré : {e}")

    return documents
