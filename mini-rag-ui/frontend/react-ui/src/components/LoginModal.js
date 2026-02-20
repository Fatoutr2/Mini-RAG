import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/LanguageContext";
import "../assets/css/login.css";

function LoginModal({ onClose }) {
  const { login } = useAuth();
  const { t } = useI18n();
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
        setError(errData.detail || t("loginError"));
        return;
      }

      const data = await res.json();
      login(data.access_token, data.role, data.refresh_token, email.trim());
    } catch (err) {
      setError(t("networkError"));
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>{t("landingLogin")}</h3>

        <input
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={submit} className="hero-btn">
          {t("loginAction")}
        </button>
        <button onClick={onClose} className="login-btn">
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export default LoginModal;
