import { useEffect, useRef, useState } from "react";
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
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const sidebarRef = useRef(null);

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

  useEffect(() => {
    const onDocClick = (e) => {
      if (open && window.innerWidth <= 900 && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  const closeIfMobile = () => {
    if (window.innerWidth <= 900) onClose?.();
  };

  return (
    <aside ref={sidebarRef} className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <span>(•‿•)</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-top">
        <button className="sidebar-btn" onClick={(e) => { onNewChat(e); closeIfMobile(); }}>✍️ Nouveau chat</button>
        <input
          className="sidebar-search"
          placeholder="🔍 Rechercher chat"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-section-title">Vos chats</div>
      <div className="sidebar-list">
        {threads.map((t) => (
          <div key={t.id} className={`thread-row ${activeThreadId === t.id ? "active" : ""}`}>
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
                <button className="thread-title-btn" onClick={() => { onSelectThread(t.id); closeIfMobile(); }}>
                  {t.title}
                </button>
                <button className="thread-more-btn" onClick={() => startEdit(t)}>✏️</button>
              </>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="sidebar-section-title">Administration</div>
          <ul className="admin-menu">
            <li><button onClick={() => { onOpenAccess?.(); closeIfMobile(); }}>🔑 Accès</button></li>
            <li><button onClick={() => { onOpenMembers?.(); closeIfMobile(); }}>👤 Membres</button></li>
            <li><button onClick={() => { onOpenAdmins?.(); closeIfMobile(); }}>🛡 Admins</button></li>
          </ul>
        </>
      )}

    </aside>
  );
}