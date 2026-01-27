// src/components/RegisterModal.js
import { useState } from "react";
import { register } from "../services/authService";
import "../App.css";

export default function RegisterModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    try {
      await register(email, password);
      alert("Compte créé ✅");
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Créer un compte</h3>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
        <button onClick={submit}>S'inscrire</button>
        <button onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

