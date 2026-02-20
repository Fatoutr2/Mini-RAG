import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/LanguageContext";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Navbar role={user?.role || "member"} sidebarOpen={false} />
      <div className="content-row">
        <main className="admin-page-content profile-page-wrap">
          <button className="profile-back-btn" onClick={() => navigate(-1)}>
            ← {t("back")}
          </button>

          <div className="admin-page-header">
            <h1 className="admin-page-title">{t("settings")}</h1>
            <p className="admin-page-subtitle">{t("personalInfo")}</p>
          </div>

          <section className="admin-card profile-card">
            <h2 className="admin-card-title">{t("profileInfo")}</h2>
            <p className="admin-page-subtitle">{t("profileInfoHint")}</p>

            <div className="profile-avatar-placeholder">👤</div>

            <div className="profile-grid">
              <label>
                <span>{t("firstName")}</span>
                <input className="admin-input" defaultValue={(user?.email || "").split("@")[0] || ""} />
              </label>
              <label>
                <span>{t("lastName")}</span>
                <input className="admin-input" defaultValue={user?.role || ""} />
              </label>
              <label>
                <span>{t("street")}</span>
                <input className="admin-input" />
              </label>
              <label>
                <span>{t("houseNumber")}</span>
                <input className="admin-input" />
              </label>
              <label>
                <span>{t("postalCode")}</span>
                <input className="admin-input" />
              </label>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
