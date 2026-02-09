import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { deleteUser, listUsers, updateUser, updateUserRole } from "../services/adminUserService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function MembersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <div className="app-layout">
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} />
      <div className="content-row">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} threads={[]} activeThreadId={null} />

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
