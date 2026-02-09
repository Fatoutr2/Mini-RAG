from database import get_db

with get_db() as db:
    cur = db.cursor()
    cur.execute("SELECT 1")
    print(cur.fetchone())
