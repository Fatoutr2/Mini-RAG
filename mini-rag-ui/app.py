# --- Interface utilisateur du Mini RAG avec Streamlit ---

# --- Importation des bibliotheques ---
import streamlit as st
from rag_core import load_documents, create_vector_store, retrieve
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import os

# --- Client OpenRouter ---
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# --- Initialisation RAG ---
@st.cache_resource

# Cette fonction initialise tout le pipeline RAG.
# Elle est mise en cache pour éviter de recalculer :
# - le chunking
# - les embeddings
# - l'index FAISS
# à chaque interaction utilisateur.

def init_rag():
    # load_documents doit retourner chunks et metadata
    chunks, metadata = load_documents() # Chargement et découpage des documents en chunks
    index = create_vector_store(chunks)  # Création de l'index vectoriel FAISS à partir des chunks
    return chunks, metadata, index # Retourne tous les éléments nécessaires au RAG

chunks, metadata, index = init_rag() # Appel de l'initialisation RAG

# --- Interface Utilisateur ---
st.set_page_config(page_title="Mini RAG", layout="wide")
st.title("🤖 Mini RAG")
st.markdown("Pose une question basée sur les documents fournis.")

question = st.text_input("❓ Votre question")

# --- Traitement de la question posee par l'utilisateur ---
if st.button("🔍 Rechercher") and question:

    # Embedding modele
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Récupération des chunks pertinents
    results = retrieve(question, index, chunks, metadata, model, top_k=5)

    # Si aucun chunk pertinent n’est trouvé
    if not results:
        st.error("❌ La réponse n'existe pas dans les documents fournis.")
        st.stop()
    else:
        # Concaténation des chunks récupérés
        context = "\n\n".join([r[0] for r in results])

        # Prompt pour le LLM
        prompt = f"""
Tu es un assistant STRICTEMENT limité au contexte ci-dessous.

RÈGLES ABSOLUES :
- Recherchez la reponse dans les documents forurnis.
- Si la réponse n'est PAS dans le contexte, répond exactement :
  "Je ne peux pas répondre car l'information n'est pas présente dans les documents fournis."

Contexte:
{context}

Question: {question}
"""

        # Appel OpenRouter
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )

        # Affichage de la réponse
        st.subheader("✅ Réponse")
        st.write(response.choices[0].message.content)

        # Affichage des chunks utilisés
        st.subheader("📚 Chunks utilisés")
        for chunk, meta, _ in results:  # _ = distance
            with st.expander(f"{meta['source']} – chunk {meta['chunk_id']}"):
                st.write(chunk)

