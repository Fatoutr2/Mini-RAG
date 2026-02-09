import { useAuth } from "../auth/AuthContext";
import "../assets/css/sidebar.css";
import "../assets/css/layout.css";

export default function MemberSidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <span>(•‿•)</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-top">
        <button className="sidebar-btn">✍️ Nouveau chat</button>
        <button className="sidebar-btn ghost">🔍 Rechercher chat</button>
      </div>

      <div className="sidebar-section-title">Vos chats</div>
      <div className="sidebar-list">
        <button className="sidebar-btn ghost">Conversation 1</button>
        <button className="sidebar-btn ghost">Conversation 2</button>
      </div>

      <div className="sidebar-bottom">
        <button className="logout" onClick={logout}>Déconnexion</button>
      </div>
    </aside>
  );
}
