import requests
import time

BASE_URL = "http://127.0.0.1:8000"


# ---------------- UTILS ----------------
def wait_for_server(timeout=10):
    print("⏳ Vérification du serveur FastAPI...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{BASE_URL}/public/company-info", timeout=1)
            if r.status_code == 200:
                print("✅ Serveur prêt")
                return True
        except Exception:
            time.sleep(1)
    print("❌ Serveur non accessible")
    return False


def register_user(email, password):
    r = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": email, "password": password}
    )
    print("Register:", r.status_code, r.json())


def login_user(email, password):
    r = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    print("Login:", r.status_code, r.json())
    if r.status_code == 200:
        return r.json()["access_token"]
    return None


def query_rag(token, question):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.post(
        f"{BASE_URL}/query",
        json={"question": question},
        headers=headers
    )
    print("RAG:", r.status_code, r.json())


def admin_users(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/auth/admin/users", headers=headers)
    print("Admin Users:", r.status_code, r.json())


def admin_conversations(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/auth/admin/conversations", headers=headers)
    print("Admin Conversations:", r.status_code, r.json())


# ---------------- MAIN ----------------
if __name__ == "__main__":

    if not wait_for_server():
        exit(1)

    print("\n===== 👤 VISITOR =====")
    r = requests.get(f"{BASE_URL}/public/company-info")
    print("Public info:", r.status_code, r.json())

    r = requests.post(f"{BASE_URL}/query", json={"question": "Test sans token"})
    print("Query sans token:", r.status_code, r.json())

    print("\n===== 👤 MEMBER =====")
    email_member = "test@gmail.com"
    password = "12345678"

    register_user(email_member, password)
    member_token = login_user(email_member, password)

    if member_token:
        query_rag(member_token, "Quelle est l'entreprise Mini RAG ?")

    print("\n===== 👑 ADMIN =====")
    admin_token = login_user("testad@gmail.com", "12345678")

    if admin_token:
        query_rag(admin_token, "Question admin test")
        admin_users(admin_token)
        admin_conversations(admin_token)
