import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/LanguageContext";
import { getMyProfile, updateMyProfile } from "../services/profileService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    avatar_url: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        setForm({
          first_name: me.first_name || "",
          last_name: me.last_name || "",
          email: me.email || "",
          phone_number: me.phone_number || "",
          address: me.address || "",
          avatar_url: me.avatar_url || "",
        });
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatar_url: reader.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateMyProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        address: form.address,
        avatar_url: form.avatar_url,
      });
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  };

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

          {error && <p className="admin-error">{error}</p>}

          <section className="admin-card profile-card">
            <h2 className="admin-card-title">{t("profileInfo")}</h2>
            <p className="admin-page-subtitle">{t("profileInfoHint")}</p>

            <div className="profile-avatar-block">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="avatar" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar-placeholder">👤</div>
              )}

              <div className="profile-avatar-actions">
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickAvatar} />
                <button className="admin-btn" type="button" onClick={() => fileInputRef.current?.click()}>{t("changePhoto")}</button>
                <button className="admin-btn" type="button" onClick={() => setForm((p) => ({ ...p, avatar_url: "" }))}>{t("keepDefaultPhoto")}</button>
              </div>
            </div>

            <form className="profile-grid" onSubmit={onSave}>
              <label>
                <span>{t("firstName")}</span>
                <input className="admin-input" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
              </label>
              <label>
                <span>{t("lastName")}</span>
                <input className="admin-input" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
              </label>
              <label>
                <span>{t("email")}</span>
                <input className="admin-input" value={form.email} disabled />
              </label>
              <label>
                <span>{t("phoneNumber")}</span>
                <input className="admin-input" value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} />
              </label>
              <label>
                <span>{t("address")}</span>
                <input className="admin-input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </label>
              <button className="admin-btn primary" disabled={saving}>{saving ? t("loading") : t("save")}</button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
