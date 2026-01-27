# 🧠 Mini RAG Prototype (React + FastAPI)

Ce projet est un **mini prototype RAG (Retrieval-Augmented Generation)** combinant :

* un **frontend React** pour l’interface utilisateur
* un **backend FastAPI** pour la recherche et le raisonnement
* une **base de données vectorielle FAISS** (`rag-db`) pour stocker les chunks, les utilisateurs et aussi les conversations.

Il permet de poser des questions sur des documents (PDF, Word, Excel, CSV, JSON, TXT,…) et d’obtenir des réponses basées sur leur contenu.

---

## 🏗️ Architecture du projet

```
mini-rag-ui/
│
├── backend/                           # Serveur FastAPI
│   ├── api.py                         # Point d'entrée API
│   ├── rag_engine.py                  # Logique RAG
│   ├── database.py                    # Gestion base de données (SQLAlchemy ou SQLite)
│   ├── utils.py                       # Fonctions utilitaires (hash, token, validation)
│   ├── __init__.py
│
│   ├── auth/                          # Authentification backend
│   │   ├── __init__.py
│   │   ├── routes.py                  # Endpoints /login, /register, /logout
│   │   └── schemas.py                 # Pydantic models pour User, Login, Register
│
│   ├── rag/                           # Module RAG
│   │   ├── loaders/                   # Chargeurs de fichiers
│   │   │   ├── __init__.py
│   │   │   ├── txt_loader.py
│   │   │   ├── pdf_loader.py
│   │   │   ├── docx_loader.py
│   │   │   ├── csv_loader.py
│   │   │   ├── xlsx_loader.py
│   │   │   ├── json_loader.py
│   │   │   └── db_loader.py
│   │   │
│   │   ├── chunking.py                # Découpe documents en chunks
│   │   ├── embeddings.py              # Création embeddings
│   │   ├── retriever.py               # Recherche chunks pertinents
│   │   ├── reranker.py                # Tri / filtrage
│   │   ├── vectorstore.py             # Stockage vectoriel
│   │   ├── prompt.py                  # Templates pour prompt
│   │   └── __init__.py
│
├── cli/                               # CLI optionnelle
│   ├── main.py
│   └── __init__.py
│
├── data/
│   └── documents/                     # Tous les fichiers de données
│
├── frontend/
│   └── react-ui/
│       └── src/
│           ├── components/           # Composants réutilisables
│           │   ├── ChatWindow.js
│           │   ├── ChatMessages.js
│           │   ├── Sidebar.js
│           │
│           ├── pages/                # Pages principales et modals
│           │   ├── Dashboard.js
│           │   ├── AdminDashboard.js
│           │   ├── LoginModal.js
│           │   └── RegisterModal.js
│           │
│           ├── routes/               # Routes sécurisées / admin
│           │   ├── ProtectedRoute.js
│           │   └── AdminRouter.js
│           │
│           ├── services/             # Services API
│           │   ├── authService.js
│           │   └── chatService.js
│           │
│           ├── App.js
│           └── App.css
│
└── screenshots                        # Captures (Exemples de quelques questions a poser)
|
└── venv/                               # Environnement virtuel Python
```

---

## ⚙️ Prérequis

* **Python 3.11.9**
* **Node.js 18+**
* **pip** 
* Git

---

## 📦 Installation Backend (FastAPI + RAG)

### 1️⃣ Créer un environnement virtuel

```bash
python -m venv venv
venv\Scripts\activate   # Windows
```

### 2️⃣ Installer les dépendances

```bash
pip install -r requirements.txt
```

---

 ## ➡️ Définir la clé API OpenRouter :

```bash
export OPENROUTER_API_KEY="votre_cle_api"
```

---

## ▶️ Lancer le backend

```bash
uvicorn backend.api:app --reload
```

Backend disponible sur :

```
http://127.0.0.1:8000
```

---

## 💻 Installation Frontend (React)

```bash
cd frontend/react-ui
npm install
npm start
```

Frontend disponible sur :

```
http://localhost:3000
```

---

## 🔐 Authentification (401 Unauthorized)

L’API `/query` est protégée.

Exemple de header attendu :

```http
Authorization: Bearer admin-token
```

➡️ Le token est défini dans `config.json`.

---

## 🗂️ Base de données RAG (`rag-db`)

* Type : **FAISS (vector store)**
* Emplacement :

```
backend/rag-db/
```

Contient :

* index FAISS
* métadonnées des chunks

⚠️ Générée automatiquement lors de l’ingestion.

---

## 📄 Types de documents supportés

* PDF (`.pdf`)
* Word (`.docx`)
* Excel (`.xlsx`)
* CSV (`.csv`)
* JSON(`.json`)
* TXT (`.txt`)
* BASE DE DONNEES

---

## 🧪 Exemple de requête

```json
{
  "question": "Qui travaille sur le projet ShopNow ?"
}
```

---

---

## 🚀 Technologies utilisées

* FastAPI
* Sentence-Transformers
* FAISS
* OpenAI API
* React.js
* PyPDF2
* python-docx
* pandas
* openpyxl

---

## ❗ Règles du système

* L’IA répond **uniquement** à partir des documents fournis.
* Si l’information n’existe pas dans les documents, elle refuse de répondre.

---
