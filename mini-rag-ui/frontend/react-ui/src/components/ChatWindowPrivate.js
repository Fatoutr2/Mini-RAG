import { useEffect, useRef, useState } from "react";
import { FileIcon, SendIcon } from "./Icons";
import "../assets/css/chat.css";
import { getMessages, sendMessageChat, sendMessageRag } from "../services/chatService";

function ChatWindowPrivate({ sidebarOpen, activeThreadId, onThreadAutoTitleRefresh, mode = "rag" }) {
  const [messages, setMessages] = useState([]);
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
        setMessages([]);
        return;
      }
      try {
        setError("");
        const data = await getMessages(activeThreadId);
        setMessages(data.map((m) => ({ role: m.role, content: m.content })));
      } catch (err) {
        setError(err.message || "Impossible de charger les messages");
      }
    };
    load();
  }, [activeThreadId]);

  const handleSend = async (forcedText = null) => {
    const text = (forcedText ?? question).trim();
    if (!text || loading || !activeThreadId) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const data = mode === "chat" ? await sendMessageChat(activeThreadId, text) : await sendMessageRag(activeThreadId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "" }]);
      if (onThreadAutoTitleRefresh) onThreadAutoTitleRefresh();
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

  const emptyState = !messages.length;

  return (
    <div className={`chat-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="chat-messages custom-scrollbar">
        {emptyState ? (
          <div className="chat-empty-state">
            <div className="spark-box">✨</div>
            <h2>Comment puis-je vous aider aujourd'hui ?</h2>
            <p>Posez des questions sur vos documents ou discutez librement avec SmartIA.</p>
            <div className="suggestion-grid">
              <button className="suggestion-card" onClick={() => setQuestion("Peux-tu m'aider à analyser un document ?")}>📑<strong>Analyser un document</strong><span>Chargez un PDF puis posez des questions ciblées.</span></button>
              <button className="suggestion-card" onClick={() => setQuestion("Donne-moi un résumé des points clés")}>🔍<strong>Synthèse rapide</strong><span>Résume automatiquement les points importants.</span></button>
            </div>
          </div>
        ) : (
          <div className="message-stack">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role === "user" ? "right" : "left"}`}>
                <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="message-row left">
            <div className="chat-bubble assistant typing"><span /><span /><span /></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <button className="attach-btn" type="button" aria-label="Ajouter un fichier"><FileIcon className="icon-18" /></button>
        <textarea
          rows={1}
          placeholder={activeThreadId ? "Envoyer un message..." : "Créez un nouveau chat d'abord..."}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={!activeThreadId}
        />
        <button className="send-btn" onClick={() => handleSend()} disabled={loading || !activeThreadId || !question.trim()}>
          <SendIcon className="icon-18" />
        </button>
      </div>

      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}

export default ChatWindowPrivate;
