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

import psycopg2

def load_db_projects():
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
        cursor.execute("""
            SELECT 
                p.project_name,
                p.project_description,
                p.start_date,
                p.end_date,
                c.company_name
            FROM project p
            JOIN company c ON p.company_id = c.company_id
        """)

        rows = cursor.fetchall()

        texts = []
        for row in rows:
            text = f"""
            Projet: {row[0]}
            Entreprise: {row[4]}
            Description: {row[1]}
            Date de début: {row[2]}
            Date de fin: {row[3] if row[3] else 'En cours'}
            """
            texts.append(text)

        cursor.close()
        conn.close()
        return texts

    except Exception as e:
        print(f"❌ Erreur lecture projets : {e}")
        return []
