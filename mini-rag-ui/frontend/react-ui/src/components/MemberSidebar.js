import { useAuth } from "../auth/AuthContext";
import "../assets/css/sidebar.css";
import "../assets/css/layout.css";

export default function MemberSidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>

      {/* MOBILE CLOSE */}
      <div className="sidebar-header">
        <span className="close-btn">(•‿•)</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="sidebar-top">
        <a className="new-chat">✍️ Nouveau chat</a>
        <a className="new-chat">🔍 Rechercher chat</a>
      </div>

      <div>
        <span className="chat-link">Vos chats ›</span>
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-bottom">
        <button className="logout" onClick={logout}>
          Déconnexion
        </button>
      </div>

    </aside>
  );
}

