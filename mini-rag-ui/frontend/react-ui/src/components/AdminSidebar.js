import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/LanguageContext";
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
  const { t } = useI18n();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenFor(null);
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;

    const visibility = window.prompt(t("destinationPrompt"), "private")?.trim().toLowerCase() || "private";

    if (!["public", "private"].includes(visibility)) {
      window.alert(t("destinationInvalid"));
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      await onUploadFile(file, visibility);
      window.alert(`${t("uploadDoneIn")} data/${visibility}`);
    } catch (err) {
      window.alert(err.message || t("uploadImpossible"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <aside ref={sidebarRef} className={`sidebar ${open ? "open" : ""}`}>

      <div className="sidebar-logo">(•‿•) SmartIA</div>

      <div className="sidebar-top">
        <button className="sidebar-btn primary" onClick={(e) => { onNewChat(e); closeIfMobile(); }} disabled={creatingThread}>
          <PlusIcon className="icon-16" />
          {creatingThread ? t("creating") : t("newChat")}
        </button>

        <label className="sidebar-search-wrap">
          <SearchIcon className="icon-16" />
          <input className="sidebar-search" placeholder={t("searchChat")} onChange={(e) => onSearch(e.target.value)} />
        </label>
      </div>

      <button className="sidebar-section-toggle" onClick={() => setChatsCollapsed((v) => !v)} aria-expanded={!chatsCollapsed}>
        <span>{t("yourChats")}</span>
        <span className={`chevron ${chatsCollapsed ? "collapsed" : ""}`}>▾</span>
      </button>

      {!chatsCollapsed && (
        <div className="sidebar-list custom-scrollbar">
          {threads.map((tItem) => (
            <div key={tItem.id} className={`thread-row ${activeThreadId === tItem.id ? "active" : ""}`}>
              <button className="thread-title-btn" onClick={() => { onSelectThread(tItem.id); closeIfMobile(); }}>{tItem.title}</button>
              <div className="thread-menu-wrap" ref={menuOpenFor === tItem.id ? menuRef : null}>
                <button className="thread-more-btn" onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenFor((prev) => (prev === tItem.id ? null : tItem.id));
                }}>
                  <MoreIcon className="icon-16" />
                </button>
                {menuOpenFor === tItem.id && (
                  <div className="thread-dropdown">
                    <button onClick={() => {
                      const next = prompt(t("newTitlePrompt"), tItem.title);
                      if (next && next.trim()) onRenameThread(tItem.id, next.trim());
                      setMenuOpenFor(null);
                    }}>{t("rename")}</button>
                    <button className="danger" onClick={() => {
                      if (window.confirm(t("deleteChatConfirm"))) onDeleteThread(tItem.id);
                      setMenuOpenFor(null);
                    }}>{t("delete")}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

      <ul className="admin-menu">
        <li><button className={`admin-link ${isActive("/admin/access") ? "active" : ""}`} onClick={() => { navigate("/admin/access"); closeIfMobile(); }}><KeyIcon className="icon-16" />{t("adminAccess")}</button></li>
        <li><button className={`admin-link ${isActive("/admin/members") ? "active" : ""}`} onClick={() => { navigate("/admin/members"); closeIfMobile(); }}><UsersIcon className="icon-16" />{t("adminMembers")}</button></li>
        <li><button className={`admin-link ${isActive("/admin/admins") ? "active" : ""}`} onClick={() => { navigate("/admin/admins"); closeIfMobile(); }}><ShieldIcon className="icon-16" />{t("adminAdmins")}</button></li>
      </ul>

      <div className="sidebar-bottom">
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <button className="sidebar-btn" onClick={() => { fileInputRef.current?.click(); closeIfMobile(); }} disabled={uploading}>
          <FileIcon className="icon-16" />
          {uploading ? t("uploadProgress") : t("addFile")}
        </button>

        <button className="logout" onClick={() => { logout(); closeIfMobile(); }}><LogOutIcon className="icon-16" />{t("logout")}</button>
      </div>
    </aside>
  );
}
