import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { FileIcon, KeyIcon, LogOutIcon, MoreIcon, PlusIcon, SearchIcon, ShieldIcon, UsersIcon } from "./Icons";
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
  onUploadFile,
}) {
  const { logout } = useAuth();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;

    const visibility = window.prompt("Destination ? Tapez public ou private", "private")?.trim().toLowerCase() || "private";

    if (!["public", "private"].includes(visibility)) {
      window.alert("Destination invalide. Utilisez public ou private.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      await onUploadFile(file, visibility);
      window.alert(`Fichier déposé dans data/${visibility}`);
    } catch (err) {
      window.alert(err.message || "Upload impossible");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <span>(•‿•)</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-logo">(•‿•) SmartIA</div>

      <div className="sidebar-top">
        <button className="sidebar-btn primary" onClick={onNewChat} disabled={creatingThread}>
          <PlusIcon className="icon-16" />
          {creatingThread ? "Création..." : "Nouveau chat"}
        </button>

        <label className="sidebar-search-wrap">
          <SearchIcon className="icon-16" />
          <input className="sidebar-search" placeholder="Rechercher chat" onChange={(e) => onSearch(e.target.value)} />
        </label>
      </div>

      <button className="sidebar-section-toggle" onClick={() => setChatsCollapsed((v) => !v)} aria-expanded={!chatsCollapsed}>
        <span>VOS CHATS</span>
        <span className={`chevron ${chatsCollapsed ? "collapsed" : ""}`}>▾</span>
      </button>

      {!chatsCollapsed && (
        <div className="sidebar-list custom-scrollbar">
          {threads.map((t) => (
            <div key={t.id} className={`thread-row ${activeThreadId === t.id ? "active" : ""}`}>
              <button className="thread-title-btn" onClick={() => onSelectThread(t.id)}>{t.title}</button>
              <div className="thread-menu-wrap" ref={menuOpenFor === t.id ? menuRef : null}>
                <button className="thread-more-btn" onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenFor((prev) => (prev === t.id ? null : t.id));
                }}>
                  <MoreIcon className="icon-16" />
                </button>
                {menuOpenFor === t.id && (
                  <div className="thread-dropdown">
                    <button onClick={() => {
                      const next = prompt("Nouveau titre", t.title);
                      if (next && next.trim()) onRenameThread(t.id, next.trim());
                      setMenuOpenFor(null);
                    }}>Renommer</button>
                    <button className="danger" onClick={() => {
                      if (window.confirm("Supprimer ce chat ?")) onDeleteThread(t.id);
                      setMenuOpenFor(null);
                    }}>Supprimer</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

      <ul className="admin-menu">
        <li><button className={`admin-link ${isActive("/admin/access") ? "active" : ""}`} onClick={() => navigate("/admin/access")}><KeyIcon className="icon-16" />Accès</button></li>
        <li><button className={`admin-link ${isActive("/admin/members") ? "active" : ""}`} onClick={() => navigate("/admin/members")}><UsersIcon className="icon-16" />Membres</button></li>
        <li><button className={`admin-link ${isActive("/admin/admins") ? "active" : ""}`} onClick={() => navigate("/admin/admins")}><ShieldIcon className="icon-16" />Admins</button></li>
      </ul>

      <div className="sidebar-bottom">
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <button className="sidebar-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <FileIcon className="icon-16" />
          {uploading ? "Upload..." : "Ajouter fichier"}
        </button>

        <button className="logout" onClick={logout}><LogOutIcon className="icon-16" />Déconnexion</button>
      </div>
    </aside>
  );
}
