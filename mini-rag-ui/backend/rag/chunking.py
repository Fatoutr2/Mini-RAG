def paragraph_chunking(text, max_words=200):
    """
    Découpe le texte par paragraphes logiques
    """
    chunks = []
    current_words = []

    for para in text.split("\n"):
        para = para.strip()
        if not para:
            continue

        words = para.split()

        if len(current_words) + len(words) <= max_words:
            current_words.extend(words)
        else:
            chunks.append(" ".join(current_words))
            current_words = words

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks


def overlap_chunks(chunks, overlap=40):
    """
    Ajoute un recouvrement sémantique entre chunks
    """
    if overlap <= 0:
        return chunks

    final_chunks = []
    for i, chunk in enumerate(chunks):
        if i == 0:
            final_chunks.append(chunk)
        else:
            prev_words = chunks[i - 1].split()[-overlap:]
            final_chunks.append(" ".join(prev_words) + " " + chunk)

    return final_chunks


def smart_chunk(doc, max_tokens=200, overlap=40):
    text = doc.get("text", "").strip()
    source = doc.get("source", "unknown")
    doc_type = doc.get("type", "unknown")

    if not text:
        return []

    words = text.split()

    # 🔑 DOCUMENT COURT → 1 chunk garanti
    if len(words) <= max_tokens:
        return [{
            "text": f"[SOURCE:{doc_type}] {text}",
            "source": source,
            "type": doc_type
        }]

    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    chunks = []
    current = []

    for para in paragraphs:
        para_words = para.split()

        if len(current) + len(para_words) <= max_tokens:
            current.extend(para_words)
        else:
            chunks.append({
                "text": f"[SOURCE:{doc_type}] {' '.join(current)}",
                "source": source,
                "type": doc_type
            })
            current = current[-overlap:] + para_words

    if current:
        chunks.append({
            "text": f"[SOURCE:{doc_type}] {' '.join(current)}",
            "source": source,
            "type": doc_type
        })

    return chunks
