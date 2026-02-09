import { useAuth } from "../auth/AuthContext";
import "../assets/css/sidebar.css";
import "../assets/css/layout.css";

export default function MemberSidebar({
  open,
  onClose,
  threads = [],
  activeThreadId,
  onNewChat,
  onSearch,
  onSelectThread,
  onRenameThread,
}) {
  const { logout } = useAuth();

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
          <div key={t.id} className={`thread-row ${activeThreadId === t.id ? "active" : ""}`}>
            <button className="thread-title-btn" onClick={() => onSelectThread(t.id)}>
              {t.title}
            </button>
            <button
              className="thread-edit-btn"
              onClick={() => {
                const next = prompt("Nouveau titre", t.title);
                if (next && next.trim()) onRenameThread(t.id, next.trim());
              }}
            >
              ✏️
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button className="logout" onClick={logout}>Déconnexion</button>
      </div>
    </aside>
  );
}
