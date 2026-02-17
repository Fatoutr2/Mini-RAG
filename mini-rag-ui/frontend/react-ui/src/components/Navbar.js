import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./Icons";
import "../assets/css/navbar.css";

export default function Navbar({ toggle, role = "member", chatMode, onChatModeChange, sidebarOpen = true }) {
  const showModeSwitch = typeof onChatModeChange === "function";
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className={`navbar ${sidebarOpen ? "with-sidebar" : ""}`}>
      <div className="nav-left">
        <button className="menu-btn" onClick={toggle} aria-label="Ouvrir/Fermer le menu">
          <span />
          <span />
          <span />
        </button>

        {showModeSwitch && (
          <div className="nav-center-inline">
            <div className="nav-center">
              <button className={`mode-chip ${chatMode === "rag" ? "active" : ""}`} onClick={() => onChatModeChange("rag")} type="button">
                📚 RAG
              </button>
              <button className={`mode-chip ${chatMode === "chat" ? "active" : ""}`} onClick={() => onChatModeChange("chat")} type="button">
                💬 Chat
              </button>
            </div>
            <span className="mode-hint">
              Mode actuel : <strong>{chatMode === "rag" ? "📚 RAG" : "💬 Discussion"}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="nav-right">
        <button className="theme-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? <SunIcon className="w-5" /> : <MoonIcon className="w-5" />}
        </button>
        <span className="role-badge">{role === "admin" ? "Admin" : "Membre"}</span>
      </div>
    </header>
  );
}
