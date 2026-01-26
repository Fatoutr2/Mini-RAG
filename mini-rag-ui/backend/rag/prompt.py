def build_prompt(context_chunks, question):
    context = "\n\n".join(
        f"[{c['type']} | {c['source']}]\n{c['text']}"
        for c in context_chunks
    )

    return f"""
Tu es un assistant IA d’entreprise.
Tu dois répondre STRICTEMENT à partir du contexte fourni.
Si l'information n'existe pas, dis : "Information non disponible dans les documents".

CONTEXTE:
{context}

QUESTION:
{question}

RÉPONSE:
"""
