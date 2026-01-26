import { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState([]);
  const [openChunk, setOpenChunk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askRAG = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setChunks([]);

    try {
      const res = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setAnswer(data.answer || "");
      setChunks(Array.isArray(data.chunks) ? data.chunks : []);
// context = [{ text, source, chunk_id }]
    } catch {
      setError("Impossible de contacter le backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-overlay">
      <div className="app-container">
        <h1>🤖 Mini RAG</h1>
        <p className="subtitle">
          Question-réponse basée sur vos documents
        </p>

        <div className="input-container">
          <input
            type="text"
            placeholder="Posez votre question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button onClick={askRAG}>🔍</button>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>Recherche en cours...</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {answer && (
          <div className="card">
            <h2>✅ Réponse</h2>
            <p className="answer">{answer}</p>
          </div>
        )}

        {chunks.length > 0 && (
          <div className="card">
            <h2>📚 Chunks utilisés</h2>

            {chunks.map((chunk, i) => (
              <div key={i} className="chunk">
                <div
                  className="chunk-header"
                  onClick={() => setOpenChunk(openChunk === i ? null : i)}
                >
                  Chunk {i + 1}
                </div>

                {openChunk === i && (
                  <div className="chunk-content">
                    <p><strong>Type :</strong> {chunk.type}</p>
                    <p><strong>Source :</strong> {chunk.source}</p>
                    <p>{chunk.text}</p>
                  </div>

                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
