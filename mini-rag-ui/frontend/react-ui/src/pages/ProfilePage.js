import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/LanguageContext";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="app-layout">
      <Navbar role={user?.role || "member"} sidebarOpen={false} />
      <div className="content-row">
        <main className="admin-page-content">
          <div className="admin-page-header">
            <h1 className="admin-page-title">{t("profile")}</h1>
            <p className="admin-page-subtitle">{t("settings")}</p>
          </div>

          <section className="admin-card">
            <p><strong>Email:</strong> {user?.email || "-"}</p>
            <p><strong>Role:</strong> {user?.role || "-"}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
