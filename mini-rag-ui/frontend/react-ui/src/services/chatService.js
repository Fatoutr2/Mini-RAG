const API_BASE = "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchMyConversations() {
  const res = await fetch(`${API_BASE}/conversations/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Impossible de charger l'historique");
  return res.json();
}

export async function askQuestion(question) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Erreur serveur");
  return res.json();
}
