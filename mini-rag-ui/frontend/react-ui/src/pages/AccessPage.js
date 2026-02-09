import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { createUser, deleteUser, listUsers, updateUser, updateUserRole } from "../services/adminUserService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function AccessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "member", is_active: true });

  const loadUsers = async () => {
    try {
      setError("");
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
    const email = prompt("Nouvel email", u.email);
    if (!email) return;
    await updateUser(u.id, { email: email.trim() });
    await loadUsers();
  };

  const onRole = async (u) => {
    const role = prompt("Nouveau rôle: member/admin/visitor", u.role);
    if (!role) return;
    await updateUserRole(u.id, role.trim());
    await loadUsers();
  };

  const onDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    await deleteUser(u.id);
    await loadUsers();
  };

  return (
    <div className="app-layout">
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} />
      <div className="content-row">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} threads={[]} activeThreadId={null} />

        <main className="admin-page-content">
          <div className="admin-page-header">
            <h1 className="admin-page-title">🔑 Accès</h1>
            <p className="admin-page-subtitle">Créer des utilisateurs et gérer tous les accès.</p>
          </div>

          <section className="admin-card">
            <h2 className="admin-card-title">Ajouter un utilisateur</h2>
            <form className="admin-form" onSubmit={onCreate}>
              <input
                className="admin-input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
              <input
                className="admin-input"
                type="password"
                placeholder="Mot de passe"
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
                Actif
              </label>
              <button className="admin-btn primary" disabled={loading}>
                {loading ? "Création..." : "Ajouter"}
              </button>
            </form>
          </section>

          {error && <p className="admin-error">{error}</p>}

          <section className="admin-card">
            <h2 className="admin-card-title">Tous les utilisateurs</h2>
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
                  {users.map((u) => (
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
