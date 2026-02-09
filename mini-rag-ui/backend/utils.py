from .database import get_db
from fastapi import Depends, HTTPException
from .api import get_current_user


def save_conversation(user_id, question, answer, sources=None):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO conversations (user_id, question, answer, sources)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, question, answer, sources)
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
            (user_id, limit)
        )
        rows = cur.fetchall()
        cur.close()

    return [{"question": q, "answer": a} for q, a in rows]


def get_all_conversations(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Accès admin requis")

    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.user_id, u.email, c.question, c.answer, c.created_at
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        """)
        conversations = [
            {
                "id": r[0],
                "user_id": r[1],
                "email": r[2],
                "question": r[3],
                "answer": r[4],
                "created_at": r[5]
            }
            for r in cur.fetchall()
        ]
        cur.close()

    return conversations
