import { useEffect, useRef, useState } from "react";
import { FileIcon, SendIcon } from "./Icons";
import "../assets/css/chat.css";
import { getMessages, sendMessageChat, sendMessageRag } from "../services/chatService";
import { uploadDocument } from "../services/uploadService";

function ChatWindowPrivate({ sidebarOpen, activeThreadId, onThreadAutoTitleRefresh, mode = "rag" }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const load = async () => {
      if (!activeThreadId) {
        setMessages([]);
        setSelectedFiles([]);
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

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError("");

    try {
      const result = await uploadDocument(file, "private");
      const uploadedName = result?.filename || file.name;
      setSelectedFiles((prev) => {
        if (prev.includes(uploadedName)) return prev;
        return [...prev, uploadedName];
      });
    } catch (err) {
      setError(err.message || "Upload fichier impossible");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleSend = async (forcedText = null) => {
    const text = (forcedText ?? question).trim();
    if (!text || loading || !activeThreadId) return;

    const filesForRequest = [...selectedFiles];
    const fileNote = filesForRequest.length ? `\n\n📎 Fichiers joints: ${filesForRequest.join(", ")}` : "";

    setMessages((prev) => [...prev, { role: "user", content: `${text}${fileNote}` }]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const data = mode === "chat" 
        ? await sendMessageChat(activeThreadId, text, filesForRequest) 
        : await sendMessageRag(activeThreadId, text, filesForRequest);

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "" }]);
      setSelectedFiles([]);
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
              <button className="suggestion-card" onClick={() => setQuestion("Donne-moi le fichier complet contrat-prestataire.pdf")}>📂<strong>Donner un fichier complet</strong><span>Demandez « donne-moi le fichier complet NOM_FICHIER ».</span></button>
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

      {selectedFiles.length > 0 && (
        <div className="attached-files-row">
          {selectedFiles.map((name) => (
            <span key={name} className="file-chip">
              {name}
              <button type="button" onClick={() => setSelectedFiles((prev) => prev.filter((f) => f !== name))}>✕</button>
            </span>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFilePick}
        />
        <button
          className="attach-btn"
          type="button"
          aria-label="Ajouter un fichier"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || !activeThreadId}
        >
          <FileIcon className="icon-18" />
        </button>
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
