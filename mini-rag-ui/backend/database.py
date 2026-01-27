import psycopg2
from psycopg2.extras import RealDictCursor

def get_db():
    return psycopg2.connect(
        host="localhost",
        database="rag-db",
        user="postgres",
        password="postgres123",
        options="-c client_encoding=UTF8"
    )
