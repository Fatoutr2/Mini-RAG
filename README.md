# 🧠 Mini-RAG (FastAPI + React)

Mini-RAG est une application de chat RAG avec authentification (member/admin), conversations privées par thread, et panneau admin pour la gestion des utilisateurs.

---

## 🚀 Fonctionnalités principales

- Chat privé RAG (`/member`, `/admin`)
- Conversations par thread (création, renommage, suppression)
- Auth JWT (register/login)
- Rôles: `visitor`, `member`, `admin`
- Pages admin:
  - `/admin/access` : création + gestion des utilisateurs
  - `/admin/members` : gestion des membres
  - `/admin/admins` : gestion des admins
- RAG public (`/rag/visitor`)

---

## 🏗️ Architecture

```text
Mini-RAG/
├── README.md
└── mini-rag-ui/
    ├── requirements.txt
    ├── backend/
    │   ├── api.py
    │   ├── rag_engine.py
    │   ├── database.py
    │   ├── utils.py
    │   ├── auth/
    │   │   ├── security.py
    │   │   ├── routes.py
    │   │   └── models.py
    │   ├── admin/
    │   │   └── routes.py
    │   └── rag/
    │       ├── chunking.py
    │       ├── embeddings.py
    │       ├── retriever.py
    │       ├── reranker.py
    │       ├── vectorstore.py
    │       ├── prompt.py
    │       ├── social.py
    │       └── loaders/
    │           ├── txt_loader.py
    │           ├── pdf_loader.py
    │           ├── docx_loader.py
    │           ├── csv_loader.py
    │           ├── excel_loader.py
    │           ├── json_loader.py
    │           └── db_loader.py
    ├── data/
    │   ├── public/
    │   └── private/
    └── frontend/react-ui/
        ├── package.json
        ├── public/
        └── src/
            ├── App.js
            ├── auth/
            ├── components/
            ├── pages/
            ├── routes/
            ├── services/
            └── assets/css/
```

---

## ⚙️ Prérequis

- Python 3.11+
- Node.js 18+
- PostgreSQL
- pip / venv

---

## 🔧 Installation backend

```bash
cd mini-rag-ui
python -m venv .venv
# source .venv/bin/activate   # Linux/Mac
 .venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

---

## Variables d’environnement (exemple)
```bash
export OPENROUTER_API_KEY="..."
export JWT_SECRET_KEY="change-me-in-prod"
export JWT_REFRESH_SECRET_KEY="change-me-too"
export JWT_ACCESS_EXPIRE_MINUTES="30"
export JWT_REFRESH_EXPIRE_DAYS="7"
export FRONTEND_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```
# optionnel selon votre setup
```bash
export DB_HOST="localhost"
export DB_NAME="rag-db"
export DB_USER="postgres"
export DB_PASSWORD="postgres123"
```


---

## Lancer l’API
```bash
uvicorn backend.api:app --reload
```
API : http://127.0.0.1:8000

---

## 💻 Installation frontend
```bash
cd mini-rag-ui/frontend/react-ui
npm install
npm start
Frontend : http://localhost:3000
```

---

## 🔐 Auth et rôles
- POST /auth/register : crée un compte member

- POST /auth/login : retourne access_token JWT

- Routes frontend protégées :

  - /member → ProtectedRoute

  - /admin, /admin/access, /admin/members, /admin/admins → AdminRoute


---

## 🧭 Routes frontend
- / : landing / auth

- /member : chat member

- /admin : chat admin

- /admin/access : création + gestion utilisateurs

- /admin/members : listing membres

- /admin/admins : listing admins

---

## 🧩 Endpoints backend (principaux)
- Public
  - GET /public/company-info

  - POST /rag/visitor

- Auth
  - POST /auth/register

  - POST /auth/login

  - POST /auth/refresh

- Chat Threads
  - POST /conversations

  - GET /conversations/me

  - GET /conversations/{thread_id}/messages

  - POST /conversations/{thread_id}/messages

  - POST /conversations/{thread_id}/messages/rag

  - POST /conversations/{thread_id}/messages/chat

  - PATCH /conversations/{thread_id}/mode


  - PATCH /conversations/{thread_id}

  - DELETE /conversations/{thread_id}

- Admin Users
  - GET /auth/admin/users

  - POST /auth/admin/users

  - PUT /auth/admin/users/{user_id}

  - PUT /auth/admin/users/{user_id}/role?new_role=...

  - DELETE /auth/admin/users/{user_id}