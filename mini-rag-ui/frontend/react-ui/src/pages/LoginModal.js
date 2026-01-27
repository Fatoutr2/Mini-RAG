import { useState } from "react";
import "../App.css";

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return alert("Erreur login");

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    window.location.reload();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Connexion</h3>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
        <button onClick={login}>Se connecter</button>
        <button onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

export default LoginModal;
