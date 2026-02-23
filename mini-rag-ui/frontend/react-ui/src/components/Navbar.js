import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoonIcon, SunIcon } from "./Icons";
import { useI18n } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";
import "../assets/css/navbar.css";

export default function Navbar({
  toggle = () => {},
  role = "member",
  chatMode,
  onChatModeChange,
  sidebarOpen = true,
  showMenuButton = true,
  onBack,
}) {
  const showModeSwitch = typeof onChatModeChange === "function";
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const source = user?.email || role || "U";
    const parts = source.split("@")[0].split(/[._\-\s]+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [user, role]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className={`navbar ${sidebarOpen ? "with-sidebar" : ""}`}>
      <div className="nav-left">
        {showMenuButton ? (
          <button className="menu-btn" onClick={toggle} aria-label={t("menuToggle")}>
            <span />
            <span />
            <span />
          </button>
        ) : (
          <button className="menu-btn nav-back-btn" onClick={onBack} aria-label={t("back")}>
            ← {t("back")}
          </button>
        )}

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
            <option value="de">DE</option>
            <option value="es">ES</option>
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
        
        <div className="profile-wrap" ref={profileRef}>
          <button className="avatar-btn" onClick={() => setProfileOpen((v) => !v)} type="button" aria-label={t("profileMenu")}>
            {initials}
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-account-title">{t("myAccount")}</div>
              <div className="profile-divider" />
              <button
                type="button"
                onClick={() => {
                  navigate("/profile");
                  setProfileOpen(false);
                }}
              >
                <span>⚙</span>{t("settings")}
              </button>

              <button
                type="button"
                className="danger"
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
              >
                <span>↪</span>{t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}