import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/LanguageContext";
import { FileIcon, MoreIcon, PlusIcon, SearchIcon } from "./Icons";
import "../assets/css/sidebar.css";
import "../assets/css/layout.css";
import { toast } from "../utils/toast";

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
  const [renameState, setRenameState] = useState(null);
  const [deleteState, setDeleteState] = useState(null);
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
      toast.success(`${t("uploadDoneIn")} data/private`);
      closeIfMobile();
    } catch (err) {
      toast.error(err.message || t("uploadImpossible"));
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

  const onConfirmDeleteThread = async () => {
    if (!deleteState?.threadId) return;
    await onDeleteThread(deleteState.threadId);
    setDeleteState(null);
  };

  const onConfirmRenameThread = async () => {
    if (!renameState?.threadId || !renameState?.title?.trim()) return;
    await onRenameThread(renameState.threadId, renameState.title.trim());
    setRenameState(null);
  };

  return (
    <>
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
                        setRenameState({ threadId: tItem.id, title: tItem.title, loading: false });
                        setMenuOpenFor(null);
                      }}>{t("rename")}</button>
                      <button className="danger" onClick={() => {
                        setDeleteState({ threadId: tItem.id, loading: false });
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

      {renameState && (
        <div className="sidebar-modal-backdrop" onClick={() => setRenameState(null)}>
          <div className="sidebar-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("rename")}</h3>
            <input className="admin-input" value={renameState.title} onChange={(e) => setRenameState((prev) => ({ ...prev, title: e.target.value }))} />
            <div className="sidebar-modal-actions">
              <button className="admin-btn" onClick={() => setRenameState(null)}>{t("cancel")}</button>
              <button className="admin-btn primary" onClick={onConfirmRenameThread}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}

      {deleteState && (
        <div className="sidebar-modal-backdrop" onClick={() => setDeleteState(null)}>
          <div className="sidebar-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("delete")}</h3>
            <p>{t("deleteChatConfirm")}</p>
            <div className="sidebar-modal-actions">
              <button className="admin-btn" onClick={() => setDeleteState(null)}>{t("no")}</button>
              <button className="admin-btn primary" onClick={onConfirmDeleteThread}>{t("yes")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}