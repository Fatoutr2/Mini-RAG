import psycopg2

def load_db_jobs():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="jobmatchai_db",
            user="postgres",
            password="postgres123",
            options="-c client_encoding=UTF8"
        )
    except Exception as e:
        print(f"❌ Impossible de se connecter à la DB : {e}")
        return []

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT title, company, location, required_skills, description FROM jobs")
        rows = cursor.fetchall()

        texts = []
        for row in rows:
            text = f"""
            Offre: {row[0]}
            Entreprise: {row[1]}
            Lieu: {row[2]}
            Compétences requises: {row[3]}
            Description: {row[4]}
            """
            texts.append(text)

        cursor.close()
        conn.close()
        return texts
    except Exception as e:
        print(f"❌ Erreur lecture DB : {e}")
        return []
