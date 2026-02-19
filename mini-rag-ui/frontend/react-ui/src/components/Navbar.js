import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./Icons";
import { useI18n } from "../i18n/LanguageContext";
import "../assets/css/navbar.css";

export default function Navbar({ toggle, role = "member", chatMode, onChatModeChange, sidebarOpen = true }) {
  const showModeSwitch = typeof onChatModeChange === "function";
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className={`navbar ${sidebarOpen ? "with-sidebar" : ""}`}>
      <div className="nav-left">
        <button className="menu-btn" onClick={toggle} aria-label={t("menuToggle")}>
          <span />
          <span />
          <span />
        </button>

        {showModeSwitch && (
          <div className="nav-center-inline">
            <div className="nav-center">
              <button className={`mode-chip ${chatMode === "rag" ? "active" : ""}`} onClick={() => onChatModeChange("rag")} type="button">
                📚 {t("rag")}
              </button>
              <button className={`mode-chip ${chatMode === "chat" ? "active" : ""}`} onClick={() => onChatModeChange("chat")} type="button">
                💬 {t("chat")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="nav-right">
        <label className="lang-picker-wrap">
          <span className="sr-only">{t("language")}</span>
          <select className="lang-picker" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="ar">AR</option>
          </select>
        </label>

        <button
          className="theme-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
          title={theme === "dark" ? t("lightMode") : t("darkMode")}
          type="button"
        >
          {theme === "dark" ? <SunIcon className="w-5" /> : <MoonIcon className="w-5" />}
        </button>
        <span className="role-badge">{role === "admin" ? t("roleAdmin") : t("roleMember")}</span>
      </div>
    </header>
  );
}
