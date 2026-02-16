from .database import get_db


def log_admin_action(admin_user_id: int, action: str, target: str = "", details: str = ""):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO admin_audit_logs (admin_user_id, action, target, details)
            VALUES (%s, %s, %s, %s)
            """,
            (admin_user_id, action, target, details),
        )
        conn.commit()
        cur.close()
