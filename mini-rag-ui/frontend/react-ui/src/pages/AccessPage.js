import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useI18n } from "../i18n/LanguageContext";
import AdminSidebar from "../components/AdminSidebar";
import { createUser, deleteUser, listUsers, updateUser, updateUserRole } from "../services/adminUserService";
import { listThreads, createThread, renameThread, deleteThread } from "../services/chatService";
import { uploadDocument } from "../services/uploadService";
import { deleteUploadedFile, listUploadedFiles, renameUploadedFile } from "../services/adminFileService";
import { MoreIcon, SearchIcon } from "../components/Icons";
import { toast } from "sonner";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

const blankCreateForm = {
  email: "",
  password: "",
  role: "member",
  is_active: true,
  first_name: "",
  last_name: "",
  phone_number: "",
  address: "",
  avatar_url: "",
};

export default function AccessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
  const { t, lang } = useI18n();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(blankCreateForm);
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [creatingThread, setCreatingThread] = useState(false);
  const [chatMode, setChatMode] = useState("rag");
  const [fileVisibility, setFileVisibility] = useState("private");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userMenuOpenFor, setUserMenuOpenFor] = useState(null);
  const [fileMenuOpenFor, setFileMenuOpenFor] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const userMenuRef = useRef(null);
  const fileMenuRef = useRef(null);

  const loadUsers = async () => {
    try {
      setError("");
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadFiles = async (visibility = fileVisibility) => {
    try {
      setFilesLoading(true);
      setError("");
      const data = await listUploadedFiles(visibility);
      setUploadedFiles(data?.files || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const closeMenus = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpenFor(null);
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) setFileMenuOpenFor(null);
    };

    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    loadFiles(fileVisibility);
  }, [fileVisibility]);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUser(form);
      setForm(blankCreateForm);
      toast.success(t("userCreateSuccess"));
      await loadUsers();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (u) => {
    setEditForm({
      email: u.email || "",
      password: "",
      role: u.role || "member",
      is_active: !!u.is_active,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      phone_number: u.phone_number || "",
      address: u.address || "",
    });
    setEditingUser(u);
  };

  const onEditSave = async (e) => {
    e.preventDefault();
    if (!editingUser || !editForm) return;

    try {
      setEditing(true);
      setError("");
      await updateUser(editingUser.id, editForm);
      setEditingUser(null);
      setEditForm(null);
      toast.success(t("userUpdateSuccess"));
      await loadUsers();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setEditing(false);
    }
  };

  const onRole = async (u) => {
    const role = prompt(t("rolePrompt"), u.role);
    if (!role) return;
    await updateUserRole(u.id, role.trim());
    await loadUsers();
  };

  const onDelete = async (u) => {
    if (!window.confirm(t("deleteUserConfirm", { email: u.email }))) return;
    await deleteUser(u.id);
    await loadUsers();
  };

  const onToggleAccess = async (u) => {
    const nextState = !u.is_active;
    const actionLabel = nextState ? t("enableAccess") : t("disableAccess");
    if (!window.confirm(t("accessConfirm", { action: actionLabel.toLowerCase(), email: u.email }))) return;

    try {
      setError("");
      await updateUser(u.id, { is_active: nextState });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.email} ${u.role} ${u.id}`.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return uploadedFiles;
    return uploadedFiles.filter((file) => `${file.filename} ${file.visibility}`.toLowerCase().includes(q));
  }, [uploadedFiles, fileSearch]);

  const onDeleteFile = async (file) => {
    if (!window.confirm(t("deleteFileConfirm", { filename: file.filename }))) return;

    try {
      setError("");
      await deleteUploadedFile(file.visibility, file.filename);
      await loadFiles(fileVisibility);
    } catch (e) {
      setError(e.message);
    }
  };

  const onRenameFile = async (file) => {
    const nextName = prompt(t("renameFilePrompt"), file.filename);
    if (!nextName) return;

    try {
      setError("");
      await renameUploadedFile(file.visibility, file.filename, nextName.trim());
      await loadFiles(fileVisibility);
    } catch (e) {
      setError(e.message);
    }
  };

  const refreshThreads = async (search = "") => {
    const data = await listThreads(search);
    setThreads(data);
    setActiveThreadId((prevId) => {
        if (!prevId && data.length > 0) return data[0].id;
        if (prevId && !data.some((t) => t.id === prevId)) return data.length ? data[0].id : null;
        return prevId;
    });
  };

  useEffect(() => {
    refreshThreads("");
  }, []);

    const handleNewChat = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (creatingThread) return;

    setCreatingThread(true);
    try {
        const tItem = await createThread(chatMode);
      setThreads((prev) => [tItem, ...prev]);
      setActiveThreadId(tItem.id);
      navigate(`/admin?threadId=${tItem.id}`);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleSearch = async (value) => {
    await refreshThreads(value);
  };

  const handleRename = async (threadId, title) => {
    const updated = await renameThread(threadId, title);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
  };

  const handleDeleteThread = async (threadId) => {
    await deleteThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    setActiveThreadId((prevId) => (prevId === threadId ? null : prevId));
  };

  return (
    <div className={`app-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} chatMode={chatMode} onChatModeChange={setChatMode} sidebarOpen={sidebarOpen} />
      <div className="content-row">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          creatingThread={creatingThread}
          onSearch={handleSearch}
          onSelectThread={(id) => navigate(`/admin?threadId=${id}`)}
          onRenameThread={handleRename}
          onDeleteThread={handleDeleteThread}
          onUploadFile={uploadDocument}
        />

        <main className="admin-page-content">
          <div className="admin-page-header">
            <h1 className="admin-page-title">{t("accessTitle")}</h1>
            <p className="admin-page-subtitle">{t("accessSubtitle")}</p>
          </div>

          <section className="admin-card">
            <h2 className="admin-card-title">{t("addUser")}</h2>
            <form className="admin-form admin-form-wide" onSubmit={onCreate}>
              <input className="admin-input" type="email" placeholder={t("email")} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              <input className="admin-input" type="password" placeholder={t("password")} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
              <input className="admin-input" placeholder={t("firstName")} value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
              <input className="admin-input" placeholder={t("lastName")} value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
              <input className="admin-input" placeholder={t("phoneNumber")} value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} />
              <input className="admin-input" placeholder={t("address")} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              <select className="admin-select" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                {t("active")}
              </label>
              <button className="admin-btn primary" disabled={loading}>{loading ? t("creating") : t("add")}</button>
            </form>
          </section>

          {error && <p className="admin-error">{error}</p>}

          <section className="admin-card">
            <div className="admin-section-header">
              <h2 className="admin-card-title">{t("usersList")}</h2>
              <label className="admin-search-wrap">
                <SearchIcon className="icon-16" />
                <input className="admin-search-input" placeholder={t("searchUsers")} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </label>
            </div>

            <div className="users-list-wrap">
              {filteredUsers.length === 0 && <p>{t("noUsersFound")}</p>}
              {filteredUsers.map((u) => {
                const isExpanded = expandedUserId === u.id;
                return (
                  <article key={u.id} className={`user-list-card ${isExpanded ? "expanded" : ""}`}>
                    <button
                      className="user-list-summary"
                      onClick={() => {
                        setExpandedUserId((prev) => (prev === u.id ? null : u.id));
                        setUserMenuOpenFor(null);
                      }}
                    >
                      <span className="user-col email">{u.email}</span>
                      <span className="user-col role"><span className={`role-badge ${u.role}`}>{u.role}</span></span>
                    </button>

                    <div className="user-list-actions" ref={userMenuOpenFor === u.id ? userMenuRef : null}>
                      <button
                        className="thread-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserMenuOpenFor((prev) => (prev === u.id ? null : u.id));
                        }}
                      >
                        <MoreIcon className="icon-16" />
                      </button>
                      {userMenuOpenFor === u.id && (
                        <div className="thread-dropdown">
                          <button onClick={() => { openEditModal(u); setUserMenuOpenFor(null); }}>{t("edit")}</button>
                          <button onClick={() => { onRole(u); setUserMenuOpenFor(null); }}>{t("changeRole")}</button>
                          <button className={u.is_active ? "danger" : ""} onClick={() => { onToggleAccess(u); setUserMenuOpenFor(null); }}>
                            {u.is_active ? t("disableAccess") : t("enableAccess")}
                          </button>
                          <button className="danger" onClick={() => { onDelete(u); setUserMenuOpenFor(null); }}>{t("delete")}</button>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="user-list-details">
                        <h3>{t("userDetails")}</h3>
                        {u.avatar_url && <img src={u.avatar_url} alt="avatar" className="user-detail-avatar" />}
                        <p><strong>ID:</strong> {u.id}</p>
                        <p><strong>{t("email")}:</strong> {u.email}</p>
                        <p><strong>{t("active")}:</strong> {u.is_active ? t("yes") : t("no")}</p>
                        <p><strong>{t("firstName")}:</strong> {u.first_name || "-"}</p>
                        <p><strong>{t("lastName")}:</strong> {u.last_name || "-"}</p>
                        <p><strong>{t("phoneNumber")}:</strong> {u.phone_number || "-"}</p>
                        <p><strong>{t("address")}:</strong> {u.address || "-"}</p>
                        <p><strong>Rôle:</strong> {u.role}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-files-header">
              <h2 className="admin-card-title">{t("filesManagement")}</h2>
              <div className="admin-files-actions">
                <label className="admin-search-wrap">
                  <SearchIcon className="icon-16" />
                  <input className="admin-search-input" placeholder={t("searchFiles")} value={fileSearch} onChange={(e) => setFileSearch(e.target.value)} />
                </label>
                <select className="admin-select" value={fileVisibility} onChange={(e) => setFileVisibility(e.target.value)}>
                  <option value="private">private</option>
                  <option value="public">public</option>
                </select>
                <button className="admin-btn icon-only" onClick={() => loadFiles(fileVisibility)} disabled={filesLoading} title={t("refresh")} aria-label={t("refresh")}>↻</button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("file")}</th>
                    <th>{t("updatedAt")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {!filesLoading && filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={3}>{t("noFilesFound")}</td>
                    </tr>
                  )}
                  {filteredFiles.map((file) => (
                    <tr key={`${file.visibility}-${file.filename}`}>
                      <td>{file.filename}</td>
                      <td>{file.updated_at ? new Date(file.updated_at * 1000).toLocaleString(lang) : "-"}</td>
                      <td>
                        <div className="thread-menu-wrap" ref={fileMenuOpenFor === `${file.visibility}-${file.filename}` ? fileMenuRef : null}>
                          <button className="thread-more-btn" onClick={(e) => { e.stopPropagation(); setFileMenuOpenFor((prev) => (prev === `${file.visibility}-${file.filename}` ? null : `${file.visibility}-${file.filename}`)); }}>
                            <MoreIcon className="icon-16" />
                          </button>
                          {fileMenuOpenFor === `${file.visibility}-${file.filename}` && (
                            <div className="thread-dropdown">
                              <button onClick={() => { onRenameFile(file); setFileMenuOpenFor(null); }}>{t("rename")}</button>
                              <button className="danger" onClick={() => { onDeleteFile(file); setFileMenuOpenFor(null); }}>{t("delete")}</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      
      {editingUser && editForm && (
        <div className="admin-modal-backdrop" onClick={() => setEditingUser(null)}>
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-card-title">{t("editUserTitle")}</h2>
            <p className="admin-page-subtitle">ID: {editingUser.id}</p>
            <form className="admin-form admin-form-wide" onSubmit={onEditSave}>
              <input className="admin-input" type="email" placeholder={t("email")} value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} required />
              <input className="admin-input" type="password" placeholder={t("newPasswordOptional")} value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} />
              <input className="admin-input" placeholder={t("firstName")} value={editForm.first_name} onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))} />
              <input className="admin-input" placeholder={t("lastName")} value={editForm.last_name} onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))} />
              <input className="admin-input" placeholder={t("phoneNumber")} value={editForm.phone_number} onChange={(e) => setEditForm((p) => ({ ...p, phone_number: e.target.value }))} />
              <input className="admin-input" placeholder={t("address")} value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
              <input className="admin-input admin-form-full" placeholder={t("avatarUrl")} value={editForm.avatar_url} onChange={(e) => setEditForm((p) => ({ ...p, avatar_url: e.target.value }))} />
              <select className="admin-select" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="visitor">visitor</option>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <label className="admin-checkbox">
                <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))} />
                {t("active")}
              </label>
              <div className="admin-modal-actions admin-form-full">
                <button className="admin-btn" type="button" onClick={() => setEditingUser(null)}>{t("cancel")}</button>
                <button className="admin-btn primary" disabled={editing}>{editing ? t("saving") : t("save")}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}