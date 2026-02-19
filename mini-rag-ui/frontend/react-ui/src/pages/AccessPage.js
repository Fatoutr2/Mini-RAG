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
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function AccessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t, lang } = useI18n();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "member", is_active: true });
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
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userMenuOpenFor, setUserMenuOpenFor] = useState(null);
  const [fileMenuOpenFor, setFileMenuOpenFor] = useState(null);
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpenFor(null);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpenFor(null);
      }
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
    try {
      await createUser(form);
      setForm({ email: "", password: "", role: "member", is_active: true });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (u) => {
    const email = prompt(t("emailPrompt"), u.email);
    if (!email) return;
    await updateUser(u.id, { email: email.trim() });
    await loadUsers();
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

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || filteredUsers[0] || null,
    [users, selectedUserId, filteredUsers]
  );

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
        const t = await createThread(chatMode);
        setThreads((prev) => [t, ...prev]);
        setActiveThreadId(t.id);
        navigate(`/admin?threadId=${t.id}`);
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
            <form className="admin-form" onSubmit={onCreate}>
              <input
                className="admin-input"
                type="email"
                placeholder={t("email")}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <input
                className="admin-input"
                type="password"
                placeholder={t("password")}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
              <select
                className="admin-select"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                {t("active")}
              </label>
              <button className="admin-btn primary" disabled={loading}>
                {loading ? t("creating") : t("add")}
              </button>
            </form>
          </section>

          {error && <p className="admin-error">{error}</p>}

          <section className="admin-card">
            <div className="admin-section-header">
              <h2 className="admin-card-title">{t("usersList")}</h2>
              <label className="admin-search-wrap">
                <SearchIcon className="icon-16" />
                <input
                  className="admin-search-input"
                  placeholder={t("searchUsers")}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </label>
            </div>

            <div className="users-layout">
              <div className="users-cards-grid">
                {filteredUsers.map((u) => (
                  <article
                    key={u.id}
                    className={`user-card ${selectedUser?.id === u.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setUserMenuOpenFor(null);
                    }}
                  >
                    <div className="user-card-head">
                      <div>
                        <p className="user-card-email">{u.email}</p>
                        <p className="user-card-id">ID: {u.id}</p>
                      </div>
                      <div className="thread-menu-wrap" ref={userMenuOpenFor === u.id ? userMenuRef : null}>
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
                            <button onClick={() => { onEdit(u); setUserMenuOpenFor(null); }}>{t("edit")}</button>
                            <button onClick={() => { onRole(u); setUserMenuOpenFor(null); }}>{t("changeRole")}</button>
                            <button
                              className={u.is_active ? "danger" : ""}
                              onClick={() => {
                                onToggleAccess(u);
                                setUserMenuOpenFor(null);
                              }}
                            >
                              {u.is_active ? t("disableAccess") : t("enableAccess")}
                            </button>
                            <button className="danger" onClick={() => { onDelete(u); setUserMenuOpenFor(null); }}>{t("delete")}</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="user-card-meta">
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                      <span className={`status-badge ${u.is_active ? "active" : "inactive"}`}>
                        {u.is_active ? t("yes") : t("no")}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="user-detail-panel">
                {selectedUser ? (
                  <>
                    <h3>{t("userDetails")}</h3>
                    <p><strong>ID:</strong> {selectedUser.id}</p>
                    <p><strong>{t("email")}:</strong> {selectedUser.email}</p>
                    <p><strong>{t("active")}:</strong> {selectedUser.is_active ? t("yes") : t("no")}</p>
                    <p><strong>Rôle:</strong> {selectedUser.role}</p>
                  </>
                ) : (
                  <p>{t("noUsersFound")}</p>
                )}
              </aside>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-files-header">
              <h2 className="admin-card-title">{t("filesManagement")}</h2>
              <div className="admin-files-actions">
                <label className="admin-search-wrap">
                  <SearchIcon className="icon-16" />
                  <input
                    className="admin-search-input"
                    placeholder={t("searchFiles")}
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                  />
                </label>
                <select
                  className="admin-select"
                  value={fileVisibility}
                  onChange={(e) => setFileVisibility(e.target.value)}
                >
                  <option value="private">private</option>
                  <option value="public">public</option>
                </select>
                <button className="admin-btn" onClick={() => loadFiles(fileVisibility)} disabled={filesLoading}>
                  {filesLoading ? t("loading") : t("refresh")}
                </button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("file")}</th>
                    <th>{t("visibility")}</th>
                    <th>{t("sizeBytes")}</th>
                    <th>{t("updatedAt")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {!filesLoading && filteredFiles.length === 0 && (
                    <tr>
                      <td colSpan={5}>{t("noFilesFound")}</td>
                    </tr>
                  )}
                  {filteredFiles.map((file) => (
                    <tr key={`${file.visibility}-${file.filename}`}>
                      <td>{file.filename}</td>
                      <td>
                        <span className={`visibility-badge ${file.visibility}`}>{file.visibility}</span>
                      </td>
                      <td>{file.size}</td>
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
    </div>
  );
}