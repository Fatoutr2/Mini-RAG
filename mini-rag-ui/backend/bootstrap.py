#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Bootstrap DB Mini-RAG
- Charge un fichier .env explicite
- Crée la base si besoin (option --create-db)
- Crée/valide les tables nécessaires
- Affiche le contexte réel (DB, user, schema, search_path)
"""

import os
import sys
import argparse
from urllib.parse import urlparse

import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv


def parse_database_url(db_url: str):
    """
    Parse DATABASE_URL style:
    postgresql://user:password@host:5432/dbname
    """
    parsed = urlparse(db_url)
    if parsed.scheme not in ("postgresql", "postgres"):
        raise ValueError(f"Scheme DATABASE_URL invalide: {parsed.scheme}")

    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "database": (parsed.path or "/postgres").lstrip("/"),
    }


def load_config(env_file: str):
    if env_file and os.path.exists(env_file):
        load_dotenv(env_file, override=True)
        print(f"✅ .env chargé: {env_file}")
    else:
        # fallback: .env local
        load_dotenv(override=True)
        print("ℹ️ Chargement .env par défaut (si présent)")

    db_url = os.getenv("DATABASE_URL")
    if db_url:
        cfg = parse_database_url(db_url)
        print("✅ DATABASE_URL détecté")
        return cfg

    # fallback variables séparées
    cfg = {
        "host": os.getenv("POSTGRES_HOST", os.getenv("DB_HOST", "localhost")),
        "port": int(os.getenv("POSTGRES_PORT", os.getenv("DB_PORT", "5432"))),
        "user": os.getenv("POSTGRES_USER", os.getenv("DB_USER", "postgres")),
        "password": os.getenv("POSTGRES_PASSWORD", os.getenv("DB_PASSWORD", "postgres123")),
        "database": os.getenv("POSTGRES_DB", os.getenv("DB_NAME", "rag-db")),
    }
    print("✅ Variables DB séparées utilisées")
    return cfg


def connect_db(cfg, dbname=None, autocommit=False):
    conn = psycopg2.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=dbname or cfg["database"],
    )
    conn.autocommit = autocommit
    return conn


def ensure_database_exists(cfg):
    target_db = cfg["database"]
    with connect_db(cfg, dbname="postgres", autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
            exists = cur.fetchone() is not None
            if exists:
                print(f"✅ Base existe déjà: {target_db}")
                return

            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(target_db)))
            print(f"✅ Base créée: {target_db}")


def print_context(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT current_database(), current_user, current_schema()")
        row = cur.fetchone()
        print(f"📌 Contexte: db={row[0]} user={row[1]} schema={row[2]}")

        cur.execute("SHOW search_path")
        sp = cur.fetchone()
        print(f"📌 search_path: {sp[0]}")


def create_tables(conn):
    ddl = """
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      first_name VARCHAR(120),
      last_name VARCHAR(120),
      phone_number VARCHAR(40),
      address TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sources JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(160) NOT NULL DEFAULT 'Nouveau chat',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      details JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_threads_user ON chat_threads(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON chat_messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    """
    with conn.cursor() as cur:
        cur.execute(ddl)
    conn.commit()
    print("✅ Tables/Index créés (ou déjà présents)")


def list_tables(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema='public'
            ORDER BY table_name
        """)
        rows = cur.fetchall()

    print("📋 Tables public:")
    for schema, name in rows:
        print(f" - {schema}.{name}")


def sanity_check_users(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_name='users'
            ORDER BY table_schema
        """)
        rows = cur.fetchall()

    if not rows:
        raise RuntimeError("❌ Table users introuvable après bootstrap")
    print(f"✅ users trouvée: {rows}")


def main():
    parser = argparse.ArgumentParser(description="Bootstrap DB Mini-RAG")
    parser.add_argument("--env", default=".env", help="Fichier .env à charger (ex: .env.local, .env.dev)")
    parser.add_argument("--create-db", action="store_true", help="Créer la base si elle n'existe pas")
    args = parser.parse_args()

    try:
        cfg = load_config(args.env)
        print(f"🔧 Config DB: host={cfg['host']} port={cfg['port']} db={cfg['database']} user={cfg['user']}")

        if args.create_db:
            ensure_database_exists(cfg)

        with connect_db(cfg) as conn:
            print_context(conn)
            create_tables(conn)
            sanity_check_users(conn)
            list_tables(conn)

        print("🎉 Bootstrap terminé avec succès.")
        return 0

    except Exception as e:
        print(f"❌ Erreur bootstrap: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
