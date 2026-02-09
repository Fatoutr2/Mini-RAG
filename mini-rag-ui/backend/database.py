# backend/database.py
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

@contextmanager
def get_db():
    conn = psycopg2.connect(
        host="localhost",
        database="rag-db",
        user="postgres",
        password="postgres123",
        options="-c client_encoding=UTF8"
    )
    try:
        yield conn
    finally:
        conn.close()
