import { useEffect, useRef, useState } from "react";
import "../assets/css/chat.css";
import { getMessages, sendMessageChat, sendMessageRag } from "../services/chatService";

function ChatWindowPrivate({ sidebarOpen, activeThreadId, onThreadAutoTitleRefresh, mode = "rag" }) {  
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour 👋 En quoi puis-je vous aider aujourd’hui ?" },
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

  const sendByMode = async (threadId, text) => {
    if (mode === "chat") return sendMessageChat(threadId, text);
    return sendMessageRag(threadId, text);
  };

  const handleSend = async (forcedText = null) => {
    const text = (forcedText ?? question).trim();
    if (!text || loading || !activeThreadId) return;

    if (!forcedText) {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setQuestion("");
    }

    setLoading(true);
    setError("");

    try {
      const data = await sendByMode(activeThreadId, text);
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

  const handleRegenerate = async (assistantIndex) => {
    const lastUser = [...messages.slice(0, assistantIndex)].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    setMessages((prev) => prev.filter((_, idx) => idx !== assistantIndex));
    await handleSend(lastUser.content);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch (_) {
      setError("Impossible de copier");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const sourceLabel = mode === "chat" ? "LLM pur" : "Réponse basée sur documents internes";

  return (
    <div className={`chat-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>

      <div className="chat-mode-banner">
        Mode actuel : <strong>{mode === "chat" ? "💬 Chat" : "📚 RAG"}</strong>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role === "user" ? "right" : "left"}`}>
            <div className={`chat-bubble ${msg.role}`}>
              {msg.content}
              {msg.role === "assistant" && (
                <div className="assistant-actions">
                  <button type="button" onClick={() => handleCopy(msg.content)}>Copier</button>
                  <button type="button" onClick={() => handleRegenerate(i)}>Régénérer</button>
                </div>
              )}
            </div>
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
        <button onClick={() => handleSend()} disabled={loading || !activeThreadId}>➤</button>
      </div>

      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}

export default ChatWindowPrivate;
