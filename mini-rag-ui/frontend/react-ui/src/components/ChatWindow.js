import { useState } from "react";

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askRAG = async () => {
    if (!question.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
        setError("Veuillez vous connecter pour poser une question.");
        return;
    }

    const userMessage = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);

    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          context: data.context || []
        }
      ]);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            <p>{msg.content}</p>

            {msg.role === "assistant" && msg.context?.length > 0 && (
              <details className="sources">
                <summary>📚 Sources</summary>
                {msg.context.map((c, j) => (
                    <div key={j} className="chunk">
                        <b>{c.source?.toString()}</b>
                        <p>{typeof c.text === "string" ? c.text : JSON.stringify(c.text)}</p>
                    </div>
                ))}

              </details>
            )}
          </div>
        ))}

        {loading && (
          <div className="bubble assistant loading">
            ⏳ Génération de la réponse...
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          placeholder="Posez votre question…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askRAG()}
        />
        <button onClick={askRAG}>➤</button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ChatWindow;
