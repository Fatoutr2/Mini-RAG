const API_BASE = "http://127.0.0.1:8000";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/auth/admin/users`, { headers: headers() });
  if (!res.ok) throw new Error("Impossible de charger les utilisateurs");
  return res.json();
}

export async function updateUserRole(userId, newRole) {
  const res = await fetch(`${API_BASE}/auth/admin/users/${userId}/role?new_role=${newRole}`, {
    method: "PUT",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Impossible de changer le rôle");
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Impossible de supprimer");
  return res.json();
}
