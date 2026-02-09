import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../assets/css/sidebar.css";
import "../assets/css/layout.css";

export default function AdminSidebar({
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
  onOpenAccess,
  onOpenMembers,
  onOpenAdmins,
}) {
  const { logout } = useAuth();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

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

      <div className="sidebar-section-title">Vos chats</div>
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

      <ul className="admin-menu">
        <li>
          <button
            className={`admin-link ${isActive("/admin/access") ? "active" : ""}`}
            onClick={() => navigate("/admin/access")}
          >
            🔑 Accès
          </button>
        </li>
        <li>
          <button
            className={`admin-link ${isActive("/admin/members") ? "active" : ""}`}
            onClick={() => navigate("/admin/members")}
          >
            👤 Membres
          </button>
        </li>
        <li>
          <button
            className={`admin-link ${isActive("/admin/admins") ? "active" : ""}`}
            onClick={() => navigate("/admin/admins")}
          >
            🛡 Admins
          </button>
        </li>
      </ul>


      <div className="sidebar-bottom">
        <button className="logout" onClick={logout}>Déconnexion</button>
      </div>
    </aside>
  );
}
