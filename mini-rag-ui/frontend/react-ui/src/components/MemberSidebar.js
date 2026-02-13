import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../assets/css/sidebar.css";
import "../assets/css/layout.css";

export default function MemberSidebar({
  open,
  onClose,
  threads = [],
  activeThreadId,
  onNewChat,
  creatingThread = false,
  onSearch,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
  onUploadFile,
}) {
  const { logout } = useAuth();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;

    setUploading(true);
    try {
      await onUploadFile(file);
      window.alert("Fichier déposé dans data/private");
    } catch (err) {
      window.alert(err.message || "Upload impossible");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpenFor(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <span>(•‿•)</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-top">
        <button className="sidebar-btn" onClick={onNewChat} disabled={creatingThread}>
          {creatingThread ? "Création..." : "✍️ Nouveau chat"}
        </button>
        <input
          className="sidebar-search"
          placeholder="🔍 Rechercher chat"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-divider" />

      <button
        className="sidebar-section-toggle"
        onClick={() => setChatsCollapsed((v) => !v)}
        aria-expanded={!chatsCollapsed}
      >
        <span>Vos chats</span>
        <span className={`chevron ${chatsCollapsed ? "collapsed" : ""}`}>▾</span>
      </button>

      {!chatsCollapsed && (
        <div className="sidebar-list">
          {threads.map((t) => (
            <div key={t.id} className={`thread-row ${activeThreadId === t.id ? "active" : ""}`}>
              <button className="thread-title-btn" onClick={() => onSelectThread(t.id)}>
                {t.title}
              </button>

              <div className="thread-menu-wrap" ref={menuOpenFor === t.id ? menuRef : null}>
                <button
                  className="thread-more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenFor((prev) => (prev === t.id ? null : t.id));
                  }}
                >
                  ⋯
                </button>

                {menuOpenFor === t.id && (
                  <div className="thread-dropdown">
                    <button
                      onClick={() => {
                        const next = prompt("Nouveau titre", t.title);
                        if (next && next.trim()) onRenameThread(t.id, next.trim());
                        setMenuOpenFor(null);
                      }}
                    >
                      Renommer
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (window.confirm("Supprimer ce chat ?")) onDeleteThread(t.id);
                        setMenuOpenFor(null);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-bottom">
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="sidebar-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Upload..." : "📁 Ajouter fichier"}
        </button>

        <div className="sidebar-divider" />

        <button className="logout" onClick={logout}>Déconnexion</button>
      </div>
    </aside>
  );
}
