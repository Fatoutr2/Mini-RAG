import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n/LanguageContext";
import "../assets/css/Index.css";
import VisitorRAG from "./VisitorRAG";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import RobotButton from "../components/RobotButton";

export default function Index() {
  const [showRAG, setShowRAG] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const location = useLocation();
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("login") === "1") {
      setShowLogin(true);
    }
  }, [location.search]);

  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>SmartIA</h1>
        <nav>
            <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </div>

          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#home" className={activeSection === "home" ? "active" : ""}>{t("landingHome")}</a>
            <a href="#services" className={activeSection === "services" ? "active" : ""}>{t("landingServices")}</a>
            <a href="#about" className={activeSection === "about" ? "active" : ""}>{t("landingAbout")}</a>
            <a href="#contact" className={activeSection === "contact" ? "active" : ""}>{t("landingContact")}</a>

            <label className="landing-lang-wrap" aria-label={t("language")}>
              <select className="landing-lang-picker" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="de">DE</option>
                <option value="es">ES</option>
              </select>
            </label>

            <button className="login-btn" onClick={() => setShowLogin(true)}>
              {t("landingLogin")}
            </button>
          </div>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-overlay">
          <h2>{t("landingHeroTitle")}</h2>
          <p>{t("landingHeroSubtitle")}</p>
          <button className="hero-btn" onClick={() => setShowRAG(true)}>{t("landingStart")}</button>
        </div>
      </section>

      <section className="section services" id="services">
            <h1>{t("landingServicesTitle")}</h1>
        <div className="cards-grid">
          <div className="card">🧑🏻‍💻 {t("landingService1")}</div>
          <div className="card">👾 {t("landingService2")}</div>
          <div className="card">📳 {t("landingService3")}</div>
          <div className="card">🛖 {t("landingService4")}</div>
          <div className="card">🔐 {t("landingService5")}</div>
          <div className="card">🤖 {t("landingService6")}</div>
          <div className="card">⚡ {t("landingService7")}</div>
          <div className="card">📚 {t("landingService8")}</div>
        </div>
      </section>

      <section className="section about" id="about">
        <h1>{t("landingAboutTitle")}</h1>  
        <div className="about-content">
            <p><strong>SmartIA</strong> {t("landingAboutP1")}</p>
          <p>{t("landingAboutP2")}</p>
          <div className="about-stats">
            <div><span>+5</span> {t("landingStat1")}</div>
            <div><span>+30</span> {t("landingStat2")}</div>
            <div><span>100%</span> {t("landingStat3")}</div>
          </div>
        </div>
      </section>
        
      <section className="section contact" id="contact">
        <h1>{t("landingContactTitle")}</h1>
        <div className="contact-grid">
        <div className="contact-card">📧 <strong>{t("landingEmail")}</strong><p>contact@smartia.com</p></div>
          <div className="contact-card">📞 <strong>{t("landingPhone")}</strong><p>+212 6 00 00 00 00</p></div>
          <div className="contact-card">📍 <strong>{t("landingAddress")}</strong><p>Maroc</p></div>
        </div>
      </section>

      <footer className="landing-footer">&copy; {new Date().getFullYear()} SmartIA – {t("landingRights")}</footer>

      <RobotButton onClick={() => setShowRAG(true)} className="robot-btn" />

      {showRAG && <VisitorRAG onClose={() => setShowRAG(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
    </div>
  );
}