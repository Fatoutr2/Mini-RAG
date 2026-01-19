## 📌 Description

Ce projet est un **mini prototype RAG (Retrieval-Augmented Generation)** développé avec "Python, Streamlit, FAISS et SentenceTransformers".
Il permet de poser des questions à une IA en se basant "uniquement sur des documents fournis" (TXT, PDF, DOCX).

Le système repose sur :

* le chunking des documents,
* la génération d’embeddings,
* une recherche vectorielle,
* et un LLM pour générer la réponse à partir du contexte récupéré.

---

## ⚙️ Technologies utilisées

* Python 3.11.9
* Streamlit
* SentenceTransformers
* FAISS
* OpenRouter (LLM)
* PyPDF2
* python-docx

---

## 📂 Structure du projet

```
mini-rag/
├── app.py              # Interface Streamlit
├── rag_core.py         # Logique RAG (chunking, embedding, retrieval)
├── requirements.txt
├── data/               # Documents sources
└── README.md
└── screenshots         # Captures
```

---

## ▶️ Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/votre-username/mini-rag.git
cd mini-rag
```

2. Installer les dépendances :

```bash
pip install -r requirements.txt
```

3. Définir la clé API OpenRouter :

```bash
export OPENROUTER_API_KEY="votre_cle_api"
```

---

## 🚀 Lancer l’application

```bash
streamlit run app.py
```

---

## ❗ Règles du système

* L’IA répond **uniquement** à partir des documents fournis.
* Si l’information n’existe pas dans les documents, elle refuse de répondre.
* Les figures et images ne sont pas interprétées (RAG textuel).

---

## 📌 Limites

* Pas de lecture des figures/images
* Lecture partielle des tableaux PDF
* Système RAG textuel uniquement
