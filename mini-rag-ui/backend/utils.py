import re

from fastapi import Depends, HTTPException

from .database import get_db
from .auth.security import get_current_user


def save_conversation(user_id, question, answer, sources=None):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO conversations (user_id, question, answer, sources)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, question, answer, sources),
        )
        conn.commit()
        cur.close()


def get_history(user_id, limit=5):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT question, answer
            FROM conversations
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        rows = cur.fetchall()
        cur.close()

    return [{"question": q, "answer": a} for q, a in rows]


def get_all_conversations(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT c.id, c.user_id, u.email, c.question, c.answer, c.created_at
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
            """
        )
        conversations = [
            {
                "id": r[0],
                "user_id": r[1],
                "email": r[2],
                "question": r[3],
                "answer": r[4],
                "created_at": r[5],
            }
            for r in cur.fetchall()
        ]
        cur.close()

    return conversations


def _normalize_title(text: str, max_len: int = 60) -> str:
    clean = re.sub(r"\s+", " ", (text or "").strip())
    return clean[:max_len] if clean else "Nouveau chat"


def create_thread(user_id: int, title: str = "Nouveau chat", mode: str = "rag"):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO chat_threads (user_id, title, mode)
            VALUES (%s, %s, %s)
            RETURNING id, user_id, title, mode, created_at, updated_at
            """,
            (user_id, title),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()

    return {
        "id": row[0],
        "user_id": row[1],
        "title": row[2],
        "mode": row[3] or "rag",
        "created_at": row[4],
        "updated_at": row[5],
    }


def list_threads(user_id: int, search: str = ""):
    with get_db() as conn:
        cur = conn.cursor()
        if search:
            cur.execute(
                """
                SELECT id, user_id, title, mode, created_at, updated_at
                FROM chat_threads
                WHERE user_id = %s AND title ILIKE %s
                ORDER BY updated_at DESC
                """,
                (user_id, f"%{search}%"),
            )
        else:
            cur.execute(
                """
                SELECT id, user_id, title, mode, created_at, updated_at
                FROM chat_threads
                WHERE user_id = %s
                ORDER BY updated_at DESC
                """,
                (user_id,),
            )
        rows = cur.fetchall()
        cur.close()

    return [
        {
            "id": r[0],
            "user_id": r[1],
            "title": r[2],
            "mode": r[3] or "rag",
            "created_at": r[4],
            "updated_at": r[5],
        }
        for r in rows
    ]


def get_thread_messages(user_id: int, thread_id: int):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id FROM chat_threads WHERE id=%s AND user_id=%s",
            (thread_id, user_id),
        )
        owner = cur.fetchone()
        if not owner:
            cur.close()
            raise HTTPException(404, "Conversation introuvable")

        cur.execute(
            """
            SELECT id, role, content, created_at
            FROM chat_messages
            WHERE thread_id = %s
            ORDER BY created_at ASC
            """,
            (thread_id,),
        )
        rows = cur.fetchall()
        cur.close()

    return [{"id": r[0], "role": r[1], "content": r[2], "created_at": r[3]} for r in rows]


def rename_thread(user_id: int, thread_id: int, title: str):
    new_title = _normalize_title(title, 120)

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE chat_threads
            SET title=%s, updated_at=NOW()
            WHERE id=%s AND user_id=%s
            RETURNING id, user_id, title, mode, created_at, updated_at
            """,
            (new_title, thread_id, user_id),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()

    if not row:
        raise HTTPException(404, "Conversation introuvable")

    return {
        "id": row[0],
        "user_id": row[1],
        "title": row[2],
        "mode": row[3] or "rag",
        "created_at": row[4],
        "updated_at": row[5],
    }


def delete_thread(user_id: int, thread_id: int):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM chat_threads WHERE id=%s AND user_id=%s RETURNING id",
            (thread_id, user_id),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()

    if not row:
        raise HTTPException(404, "Conversation introuvable")
    return {"ok": True}


def append_message_and_answer(user_id: int, thread_id: int, question: str, answer: str):
    auto_title = _normalize_title(question)

    with get_db() as conn:
        cur = conn.cursor()

        cur.execute(
            "SELECT title FROM chat_threads WHERE id=%s AND user_id=%s",
            (thread_id, user_id),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(404, "Conversation introuvable")

        current_title = row[0] or "Nouveau chat"

        cur.execute(
            """
            INSERT INTO chat_messages (thread_id, role, content)
            VALUES (%s, 'user', %s)
            """,
            (thread_id, question),
        )

        cur.execute(
            """
            INSERT INTO chat_messages (thread_id, role, content)
            VALUES (%s, 'assistant', %s)
            """,
            (thread_id, answer),
        )

        if current_title.strip().lower() in {"nouveau chat", "conversation"}:
            cur.execute(
                """
                UPDATE chat_threads
                SET title=%s, updated_at=NOW()
                WHERE id=%s
                """,
                (auto_title, thread_id),
            )
        else:
            cur.execute("UPDATE chat_threads SET updated_at=NOW() WHERE id=%s", (thread_id,))

        conn.commit()
        cur.close()

    return {"ok": True}


def get_thread_mode(user_id: int, thread_id: int):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT mode FROM chat_threads WHERE id=%s AND user_id=%s", (thread_id, user_id))
        row = cur.fetchone()
        cur.close()

    if not row:
        raise HTTPException(404, "Conversation introuvable")
    return (row[0] or "rag").lower()


def set_thread_mode(user_id: int, thread_id: int, mode: str):
    normalized = (mode or "rag").strip().lower()
    if normalized not in {"rag", "chat"}:
        raise HTTPException(400, "Mode invalide")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE chat_threads
            SET mode=%s, updated_at=NOW()
            WHERE id=%s AND user_id=%s
            RETURNING id
            """,
            (normalized, thread_id, user_id),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()

    if not row:
        raise HTTPException(404, "Conversation introuvable")
    return {"ok": True, "mode": normalized}