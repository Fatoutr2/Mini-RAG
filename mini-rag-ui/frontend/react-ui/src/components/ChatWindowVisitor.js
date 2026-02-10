import { useState, useEffect } from "react";
import "../assets/css/Index.css";
function ChatWindow({ visitor = false }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Salut 👋🏻! Comment puis-je vous aider 🙂 ?" }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Endpoint selon le mode
  const endpoint = visitor
    ? "http://127.0.0.1:8000/rag/visitor"
    : "http://127.0.0.1:8000/query";

  // 🔹 Headers selon le mode
  const headers = visitor
    ? { "Content-Type": "application/json" }
    : {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      };

  // 🔹 Charger historique UNIQUEMENT pour member/admin
  useEffect(() => {
    if (visitor) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://127.0.0.1:8000/conversations/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(c => ({
          role: "assistant",
          content: `Q: ${c.question}\nA: ${c.answer}`
        }));
        setMessages(formatted);
      })
      .catch(() => {});
  }, [visitor]);

  // 🔹 Envoyer question
  const askRAG = async () => {
    if (!question.trim()) return;

    // ❌ Connexion requise SEULEMENT hors visitor
    if (!visitor && !localStorage.getItem("token")) {
      setError("Veuillez vous connecter pour poser une question.");
      return;
    }

    const userMessage = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);
    setError("");
    setQuestion("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ question })
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        ...(data.answer
          ? [{
              role: "assistant",
              content: typeof data.answer === "string"
                ? data.answer
                : JSON.stringify(data.answer)
            }]
          : [])
      ]);



    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="bubble assistant">⏳ Réponse en cours...</div>
        )}
      </div>

      <div className="chat-input">
        <input
          placeholder={
            visitor
              ? "Posez votre question sur SmartIA…"
              : "Posez votre question…"
          }
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
