import { useState, useEffect, useRef } from "react";
import "../assets/css/chat.css";

function ChatWindowPrivate({ sidebarOpen }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour 👋🏻 Je suis votre assistant SmartIA, en quoi puis-je vous aider aujourd’hui ?" }
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://127.0.0.1:8000/conversations/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const history = data.flatMap((c) => [
          { role: "user", content: c.question },
          { role: "assistant", content: c.answer }
        ]);
        setMessages((prev) => [...prev, ...history]);
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    const text = question.trim();
    if (!text || loading) return;

    if (!localStorage.getItem("token")) {
      setError("Connexion requise.");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ question: text })
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer }
      ]);
    } catch (err) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chat-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role === "user" ? "right" : "left"}`}>
            <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="message-row left">
            <div className="chat-bubble assistant">⏳ Réponse en cours...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          rows={1}
          placeholder="Envoyer un message..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button onClick={handleSend} disabled={loading}>➤</button>
      </div>

      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}

export default ChatWindowPrivate;
