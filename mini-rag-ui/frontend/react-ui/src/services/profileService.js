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

export async function getMyProfile() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: headers() });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de charger le profil"));
  return res.json();
}

export async function updateMyProfile(payload) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de mettre à jour le profil"));
  return res.json();
}