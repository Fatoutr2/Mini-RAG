import { useEffect, useRef, useState } from "react";
import "../assets/css/chat.css";
import { getMessages, sendMessage } from "../services/chatService";

function ChatWindowPrivate({ sidebarOpen, activeThreadId, onThreadAutoTitleRefresh }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour 👋 En quoi puis-je vous aider aujourd’hui ?" }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const load = async () => {
      if (!activeThreadId) {
        setMessages([{ role: "assistant", content: "Bonjour 👋 En quoi puis-je vous aider aujourd’hui ?" }]);
        return;
      }
      try {
        setError("");
        const data = await getMessages(activeThreadId);
        if (!data.length) {
          setMessages([{ role: "assistant", content: "Bonjour 👋 En quoi puis-je vous aider aujourd’hui ?" }]);
        } else {
          setMessages(data.map((m) => ({ role: m.role, content: m.content })));
        }
      } catch (err) {
        setError(err.message || "Impossible de charger les messages");
      }
    };
    load();
  }, [activeThreadId]);

  const handleSend = async () => {
    const text = question.trim();
    if (!text || loading || !activeThreadId) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const data = await sendMessage(activeThreadId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "" }]);

      if (onThreadAutoTitleRefresh) {
        onThreadAutoTitleRefresh();
      }
    } catch (err) {
      setError(err.message || "Erreur serveur");
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
          placeholder={activeThreadId ? "Envoyer un message..." : "Créez un nouveau chat d'abord..."}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={!activeThreadId}
        />
        <button onClick={handleSend} disabled={loading || !activeThreadId}>➤</button>
      </div>

      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}

export default ChatWindowPrivate;
