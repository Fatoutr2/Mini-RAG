# backend/database.py
import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv

load_dotenv()


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
