import { useState, useEffect, useRef } from "react";
import "../assets/css/chat.css";

function ChatWindowPrivate({ sidebarOpen }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour 👋🏻 Je suis votre assistant SmartIA." }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  const endpoint = "http://127.0.0.1:8000/query";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  };

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔹 Charger historique (member + admin)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://127.0.0.1:8000/conversations/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const history = data.flatMap(c => ([
          { role: "user", content: c.question },
          { role: "assistant", content: c.answer }
        ]));
        setMessages(prev => [...prev, ...history]);
      })
      .catch(() => {});
  }, []);

  // 🔹 Envoyer question
  const askRAG = async () => {
    if (!question.trim()) return;

    if (!localStorage.getItem("token")) {
      setError("Connexion requise.");
      return;
    }

    const userMessage = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);
    setQuestion("");
    setError("");

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
        { role: "assistant", content: data.answer }
      ]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="chat-bubble assistant">⏳ Réponse en cours...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          placeholder="Posez votre question…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askRAG()}
        />
        <button onClick={askRAG}>➤</button>
      </div>

      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}

export default ChatWindowPrivate;
