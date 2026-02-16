import os
import tempfile
import time

import requests

BASE_URL = "http://127.0.0.1:8000"

ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "testad@gmail.com")
ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "12345678")


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
    requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})


def login_user(email, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    print("Login:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        return data.get("access_token"), data.get("refresh_token")
    return None, None


def create_thread(token, mode="rag"):
    r = requests.post(
        f"{BASE_URL}/conversations?mode={mode}",
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code != 200:
        print("Create thread failed:", r.status_code, r.text)
        return None
    return r.json()["id"]


def ask_mode(token, thread_id, mode, question):
    r = requests.post(
        f"{BASE_URL}/conversations/{thread_id}/messages/{mode}",
        headers={"Authorization": f"Bearer {token}"},
        json={"question": question},
    )
    print(f"{mode}:", r.status_code, r.json())


def upload_public_as_member(token):
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as f:
        f.write("sample")
        path = f.name
    with open(path, "rb") as fp:
        r = requests.post(
            f"{BASE_URL}/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            data={"visibility": "public"},
            files={"file": ("sample.txt", fp, "text/plain")},
        )
    print("Upload public as member:", r.status_code, r.text)


if __name__ == "__main__":
    if not wait_for_server():
        exit(1)

    email_member = f"test_{int(time.time())}@gmail.com"
    password = "12345678"

    register_user(email_member, password)
    member_token, member_refresh = login_user(email_member, password)

    admin_token, admin_refresh = login_user(ADMIN_EMAIL, ADMIN_PASSWORD)

    if member_token:
        thread_id = create_thread(member_token, mode="chat")
        if thread_id:
            ask_mode(member_token, thread_id, "chat", "Donne-moi un résumé de SmartIA")
            ask_mode(member_token, thread_id, "rag", "Quelles infos internes as-tu ?")
        upload_public_as_member(member_token)

    if admin_token and admin_refresh:
        r = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": admin_refresh})
        print("Refresh:", r.status_code, r.text)