import { useState } from "react";
import "../App.css";

function Admin() {
  const [file, setFile] = useState(null);
  const token = localStorage.getItem("token");

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://127.0.0.1:8000/admin/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    alert("Fichier ajouté à la RAG");
  };

  return (
    <div>
      <h2>🛠️ Admin Panel</h2>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Uploader</button>
    </div>
  );
}

export default Admin;
