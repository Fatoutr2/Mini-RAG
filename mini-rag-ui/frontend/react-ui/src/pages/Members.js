import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { deleteUser, listUsers, updateUser, updateUserRole } from "../services/adminUserService";
import { listThreads, createThread, renameThread, deleteThread } from "../services/chatService";
import { uploadDocument } from "../services/uploadService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function Members() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);


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

  const onEdit = async (u) => {
    const email = prompt("Nouvel email", u.email);
    if (!email) return;
    await updateUser(u.id, { email: email.trim() });
    await load();
  };

  const onRole = async (u) => {
    const role = prompt("Nouveau rôle: member/admin/visitor", u.role);
    if (!role) return;
    await updateUserRole(u.id, role.trim());
    await load();
  };

  const onDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    await deleteUser(u.id);
    await load();
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
      const t = await createThread();
      setThreads((prev) => [t, ...prev]);
      setActiveThreadId(t.id);
      navigate(`/admin?threadId=${t.id}`);
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
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
  };

  const handleDeleteThread = async (threadId) => {
    await deleteThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    setActiveThreadId((prevId) => (prevId === threadId ? null : prevId));
  };


  return (
    <div className="app-layout">
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} />
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
            <h1 className="admin-page-title">👤 Membres</h1>
            <p className="admin-page-subtitle">Gérer les comptes membres : édition, rôle et suppression.</p>
          </div>

          {error && <p className="admin-error">{error}</p>}

          <section className="admin-card">
            <h2 className="admin-card-title">Liste des membres</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actif</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{u.is_active ? "Oui" : "Non"}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn" onClick={() => onEdit(u)}>Modifier</button>
                          <button className="admin-btn" onClick={() => onRole(u)}>Changer rôle</button>
                          <button className="admin-btn danger" onClick={() => onDelete(u)}>Supprimer</button>
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
