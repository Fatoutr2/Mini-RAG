const API_BASE = "http://127.0.0.1:8000";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export async function listThreads(search = "") {
  const url = new URL(`${API_BASE}/conversations/me`);
  if (search?.trim()) url.searchParams.set("search", search.trim());

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error("Impossible de charger les conversations");
  return res.json();
}

export async function createThread() {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) throw new Error("Impossible de créer un chat");
  return res.json();
}

export async function renameThread(threadId, title) {
  const res = await fetch(`${API_BASE}/conversations/${threadId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    let msg = "Impossible de renommer";
    try {
      const data = await res.json();
      msg =
        data?.detail ||
        data?.message ||
        (typeof data === "string" ? data : JSON.stringify(data));
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

export async function deleteThread(threadId) {
  const res = await fetch(`${API_BASE}/conversations/${threadId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    let msg = "Impossible de supprimer";
    try {
      const data = await res.json();
      msg = data?.detail || data?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getMessages(threadId) {
  const res = await fetch(`${API_BASE}/conversations/${threadId}/messages`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error("Impossible de charger les messages");
  return res.json();
}

export async function sendMessage(threadId, question) {
  const res = await fetch(`${API_BASE}/conversations/${threadId}/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Erreur serveur");
  return res.json();
}
