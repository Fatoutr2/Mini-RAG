import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import {
  listUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
} from "../services/adminUserService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";


export default function AccessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "member",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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

  const handleQuickEdit = async (u) => {
    const email = prompt("Nouvel email", u.email);
    if (!email) return;
    await updateUser(u.id, { email: email.trim() });
    await loadUsers();
  };

  const handleRole = async (u) => {
    const next = prompt("Nouveau rôle: member/admin/visitor", u.role);
    if (!next) return;
    await updateUserRole(u.id, next.trim());
    await loadUsers();
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    await deleteUser(u.id);
    await loadUsers();
  };

  return (
    <div className="app-layout">
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} />
      <div className="content-row">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={[]}
          activeThreadId={null}
          onNewChat={() => {}}
          onSearch={() => {}}
          onSelectThread={() => {}}
          onRenameThread={() => {}}
          onDeleteThread={() => {}}
        />

        <main style={{ flex: 1, padding: 20, overflow: "auto" }}>
          <h2>🔑 Accès — Ajouter un utilisateur</h2>

          <form onSubmit={handleCreate} style={{ display: "grid", gap: 10, maxWidth: 420, marginBottom: 20 }}>
            <input
              type="email"
              placeholder="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="mot de passe"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />{" "}
              Actif
            </label>
            <button disabled={loading}>{loading ? "Création..." : "Ajouter"}</button>
          </form>

          {error && <p style={{ color: "tomato" }}>{error}</p>}

          <h3>Tous les utilisateurs</h3>
          <table width="100%" cellPadding="8">
            <thead>
              <tr><th>ID</th><th>Email</th><th>Rôle</th><th>Actif</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? "Oui" : "Non"}</td>
                  <td>
                    <button onClick={() => handleQuickEdit(u)}>Modifier</button>{" "}
                    <button onClick={() => handleRole(u)}>Rôle</button>{" "}
                    <button onClick={() => handleDelete(u)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}
