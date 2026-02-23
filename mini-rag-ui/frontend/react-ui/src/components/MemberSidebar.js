import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/LanguageContext";
import { FileIcon, MoreIcon, PlusIcon, SearchIcon } from "./Icons";
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
  const { t } = useI18n();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);

  const closeIfMobile = () => {
    if (window.innerWidth <= 900) onClose?.();
  };

  const uploadSelectedFile = async (file) => {
    if (!file || !onUploadFile) return;

    setUploading(true);
    try {
      await onUploadFile(file);
      window.alert(`${t("uploadDoneIn")} data/private`);
      closeIfMobile();
    } catch (err) {
      window.alert(err.message || t("uploadImpossible"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    await uploadSelectedFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    await uploadSelectedFile(file);
  };

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

      <div className="sidebar-bottom">
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        <button
          className={`sidebar-btn ${dragActive ? "drag-active" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragActive(true); }}
          onDragEnter={(e) => { e.preventDefault(); if (!uploading) setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          disabled={uploading}
        >
          <FileIcon className="icon-16" />
          {uploading ? t("uploadProgress") : t("addFile")}
        </button>
      </div>
    </aside>
  );
}