from .database import get_db


def ensure_schema():
    with get_db() as conn:
        cur = conn.cursor()

        # Thread mode persistence
        cur.execute("ALTER TABLE IF EXISTS chat_threads ADD COLUMN IF NOT EXISTS mode VARCHAR(16) DEFAULT 'rag'")
        cur.execute(
            """
            DO $$
            BEGIN
            IF to_regclass('public.chat_threads') IS NOT NULL THEN
                UPDATE chat_threads SET mode='rag' WHERE mode IS NULL;
            END IF;
            END $$;
            """
        )


        # Refresh tokens
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                revoked BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
            """
        )

        # Admin audit logs
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id SERIAL PRIMARY KEY,
                admin_user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                target TEXT,
                details TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
            """
        )

        conn.commit()
        cur.close()