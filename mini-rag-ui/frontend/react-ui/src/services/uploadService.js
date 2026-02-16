const API_BASE = "http://127.0.0.1:8000";

async function parseError(res, fallback) {
  try {
    const data = await res.json();
    return data?.detail || data?.message || fallback;
  } catch (_) {
    return fallback;
  }
}

export async function uploadDocument(file, visibility = "private") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", visibility);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await parseError(res, "Upload impossible"));
  return res.json();
}