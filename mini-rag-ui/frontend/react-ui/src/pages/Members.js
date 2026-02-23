import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { useI18n } from "../i18n/LanguageContext";
import { toast } from "../utils/toast";
import { deleteUser, listUsers, updateUserRole } from "../services/adminUserService";
import { listThreads, createThread, renameThread, deleteThread, setThreadMode } from "../services/chatService";
import { uploadDocument } from "../services/uploadService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function Members() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [roleState, setRoleState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const navigate = useNavigate();
  const { t } = useI18n();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [chatMode, setChatMode] = useState("rag");

  const load = async () => {
    try {
      setError("");
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const members = useMemo(() => users.filter((u) => u.role === "member"), [users]);

  const onRole = (u) => {
    setRoleState({ userId: u.id, email: u.email, role: u.role, loading: false });
  };

  const onConfirmRoleChange = async () => {
    if (!roleState?.userId || !roleState?.role?.trim()) return;
    try {
      setRoleState((prev) => ({ ...prev, loading: true }));
      await updateUserRole(roleState.userId, roleState.role.trim());
      setRoleState(null);
      toast.success(t("userUpdateSuccess"));
      await load();
    } catch (e) {
      setError(e.message);
      setRoleState(null);
    }
  };

  const onDelete = (u) => {
    setConfirmState({
      message: t("deleteUserConfirm", { email: u.email }),
      loading: false,
      onConfirm: async () => {
        await deleteUser(u.id);
        toast.success(t("delete"));
        await load();
      },
    });
  };

  const onConfirmAction = async () => {
    if (!confirmState?.onConfirm) return;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (e) {
      setError(e.message);
      setConfirmState(null);
    }
  };

  const refreshThreads = async (search = "") => {
    const data = await listThreads(search);
    setThreads(data);
    setActiveThreadId((prevId) => {
      if (!prevId && data.length > 0) return data[0].id;
      if (prevId && !data.some((tItem) => tItem.id === prevId)) return data.length ? data[0].id : null;
      return prevId;
    });
  };

  useEffect(() => {
    refreshThreads("");
  }, []);

  useEffect(() => {
    const active = threads.find((tItem) => tItem.id === activeThreadId);
    if (active?.mode) setChatMode(String(active.mode).toLowerCase());
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    setThreadMode(activeThreadId, chatMode).catch(() => {});
  }, [activeThreadId, chatMode]);

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
    setSearchValue(value);
    await refreshThreads(value);
  };

  const handleRename = async (threadId, title) => {
    const updated = await renameThread(threadId, title);
    setThreads((prev) => prev.map((tItem) => (tItem.id === threadId ? updated : tItem)));
  };

  const handleDeleteThread = async (threadId) => {
    await deleteThread(threadId);
    setThreads((prev) => prev.filter((tItem) => tItem.id !== threadId));
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
            <h1 className="admin-page-title">👤 {t("adminMembers")}</h1>
            <p className="admin-page-subtitle">{t("usersList")}</p>
          </div>

          {error && <p className="admin-error">{error}</p>}

          <section className="admin-card">
            <h2 className="admin-card-title">{t("usersList")}</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t("email")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn" onClick={() => onRole(u)}>{t("changeRole")}</button>
                          <button className="admin-btn danger" onClick={() => onDelete(u)}>{t("delete")}</button>
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
      
      {roleState && (
        <div className="admin-modal-backdrop" onClick={() => !roleState.loading && setRoleState(null)}>
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-card-title">{t("changeRole")}</h2>
            <p className="admin-page-subtitle">{roleState.email}</p>
            <select className="admin-select" value={roleState.role} onChange={(e) => setRoleState((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="visitor">visitor</option>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <div className="admin-modal-actions" style={{ marginTop: 12 }}>
              <button className="admin-btn" type="button" disabled={roleState.loading} onClick={() => setRoleState(null)}>{t("cancel")}</button>
              <button className="admin-btn primary" type="button" disabled={roleState.loading} onClick={onConfirmRoleChange}>{roleState.loading ? t("loading") : t("save")}</button>
            </div>
          </section>
        </div>
      )}

      {confirmState && (
        <div className="admin-modal-backdrop" onClick={() => !confirmState.loading && setConfirmState(null)}>
          <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-card-title">{t("actions")}</h2>
            <p className="admin-page-subtitle">{confirmState.message}</p>
            <div className="admin-modal-actions" style={{ marginTop: 12 }}>
              <button className="admin-btn" type="button" disabled={confirmState.loading} onClick={() => setConfirmState(null)}>{t("no")}</button>
              <button className="admin-btn primary" type="button" disabled={confirmState.loading} onClick={onConfirmAction}>{confirmState.loading ? t("loading") : t("yes")}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}