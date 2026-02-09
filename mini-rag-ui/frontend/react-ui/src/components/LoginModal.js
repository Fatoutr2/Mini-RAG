import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../assets/css/login.css";

function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Erreur login");
        return;
      }

      const data = await res.json();
      login(data.access_token, data.role);
      onClose();
    } catch (err) {
      setError("Erreur réseau ou serveur");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>Connexion</h3>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={submit} className="hero-btn">
          Se connecter
        </button>
        <button onClick={onClose} className="login-btn">
          Annuler
        </button>
      </div>
    </div>
  );
}

export default LoginModal;
