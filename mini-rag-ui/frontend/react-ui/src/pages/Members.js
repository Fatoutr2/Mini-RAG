import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { listUsers, updateUser, updateUserRole, deleteUser } from "../services/adminUserService";
import "../assets/css/layout.css";

export default function MembersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const members = useMemo(() => users.filter((u) => u.role === "member"), [users]);

  const editUser = async (u) => {
    const email = prompt("Nouvel email", u.email);
    if (!email) return;
    await updateUser(u.id, { email: email.trim() });
    await load();
  };

  const changeRole = async (u) => {
    const role = prompt("Nouveau rôle: member/admin/visitor", u.role);
    if (!role) return;
    await updateUserRole(u.id, role.trim());
    await load();
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    await deleteUser(u.id);
    await load();
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
          <h2>👤 Membres</h2>
          {error && <p style={{ color: "tomato" }}>{error}</p>}

          <table width="100%" cellPadding="8">
            <thead>
              <tr><th>ID</th><th>Email</th><th>Rôle</th><th>Actif</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {members.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? "Oui" : "Non"}</td>
                  <td>
                    <button onClick={() => editUser(u)}>Modifier</button>{" "}
                    <button onClick={() => changeRole(u)}>Changer rôle</button>{" "}
                    <button onClick={() => removeUser(u)}>Supprimer</button>
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
