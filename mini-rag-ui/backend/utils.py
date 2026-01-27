from .database import get_db

def save_conversation(user_id, question, answer):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO conversations (user_id, question, answer) VALUES (%s, %s, %s)",
        (user_id, question, answer)
    )
    conn.commit()
    cur.close()
    conn.close()


def get_history(user_id, limit=5):
    conn = get_db()
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
    conn.close()

    return [{"question": q, "answer": a} for q, a in rows]
