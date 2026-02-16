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
  } catch (_) {
    return fallback;
  }
}

export async function listUploadedFiles(visibility = "private") {
  const url = new URL(`${API_BASE}/admin/files`);
  url.searchParams.set("visibility", visibility);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de lister les fichiers"));
  return res.json();
}

export async function deleteUploadedFile(visibility, filename) {
  const res = await fetch(`${API_BASE}/admin/files/${visibility}/${encodeURIComponent(filename)}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de supprimer le fichier"));
  return res.json();
}

export async function renameUploadedFile(visibility, filename, newName) {
  const res = await fetch(`${API_BASE}/admin/files/${visibility}/${encodeURIComponent(filename)}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ new_name: newName }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de renommer le fichier"));
  return res.json();
}

export async function reindexNow() {
  const res = await fetch(`${API_BASE}/admin/reindex`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Impossible de re-indexer"));
  return res.json();
}