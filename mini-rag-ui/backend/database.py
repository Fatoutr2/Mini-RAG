# backend/database.py
import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv

load_dotenv()


@contextmanager
def get_db():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "rag-db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres123"),
        options="-c client_encoding=UTF8",
    )
    with conn.cursor() as cur:
        cur.execute("SET search_path TO public")
    try:
        yield conn
    finally:
        conn.close()
