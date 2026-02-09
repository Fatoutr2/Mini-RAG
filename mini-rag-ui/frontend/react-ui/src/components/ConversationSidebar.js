import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../assets/css/sidebar.css";

export default function ConversationSidebar({
  open,
  onClose,
  threads = [],
  activeThreadId,
  onNewChat,
  onSearch,
  onSelectThread,
  onRenameThread,
  isAdmin = false,
  onOpenAccess,
  onOpenMembers,
  onOpenAdmins,
}) {
  const { logout } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (thread) => {
    setEditingId(thread.id);
    setEditValue(thread.title);
  };

  const submitEdit = async (id) => {
    const title = editValue.trim();
    if (!title) return;
    await onRenameThread(id, title);
    setEditingId(null);
    setEditValue("");
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <span>(•‿•)</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-top">
        <button className="sidebar-btn" onClick={onNewChat}>✍️ Nouveau chat</button>
        <input
          className="sidebar-search"
          placeholder="🔍 Rechercher chat"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-section-title">Vos chats</div>
      <div className="sidebar-list">
        {threads.map((t) => (
          <div key={t.id} className={`thread-item ${activeThreadId === t.id ? "active" : ""}`}>
            {editingId === t.id ? (
              <input
                className="thread-rename-input"
                value={editValue}
                autoFocus
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitEdit(t.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => submitEdit(t.id)}
              />
            ) : (
              <>
                <button className="thread-title-btn" onClick={() => onSelectThread(t.id)}>
                  {t.title}
                </button>
                <button className="thread-edit-btn" onClick={() => startEdit(t)}>✏️</button>
              </>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="sidebar-section-title">Administration</div>
          <ul className="admin-menu">
            <li><button onClick={onOpenAccess}>🔑 Accès</button></li>
            <li><button onClick={onOpenMembers}>👤 Membres</button></li>
            <li><button onClick={onOpenAdmins}>🛡 Admins</button></li>
          </ul>
        </>
      )}

      <div className="sidebar-bottom">
        <button className="logout" onClick={logout}>Déconnexion</button>
      </div>
    </aside>
  );
}
