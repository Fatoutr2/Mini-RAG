const API_BASE = "http://127.0.0.1:8000";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

async function parseError(res, fallback) {
  try {
    const data = await res.json();
    return data?.detail || data?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function listUsers() {
  const res = await fetch(`${API_BASE}/auth/admin/users`, { headers: headers() });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de charger les utilisateurs"));
  return res.json();
}

export async function createUser(payload) {
  const res = await fetch(`${API_BASE}/auth/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de créer l'utilisateur"));
  return res.json();
}

export async function updateUser(userId, payload) {
  const res = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de modifier l'utilisateur"));
  return res.json();
}

export async function updateUserRole(userId, newRole) {
  const res = await fetch(`${API_BASE}/auth/admin/users/${userId}/role?new_role=${newRole}`, {
    method: "PUT",
    headers: headers(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de changer le rôle"));
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de supprimer l'utilisateur"));
  return res.json();
}
