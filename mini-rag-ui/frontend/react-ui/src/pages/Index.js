import { useState } from "react";
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


  return (
    <div className="landing-container">

      {/* HEADER */}
      <header className="landing-header">
        <h1>SmartIA</h1>
        <nav>
            <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                ☰
            </div>

            <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                <a href="#home" className={activeSection === "home" ? "active" : ""}>
                Accueil
                </a>

                <a href="#services" className={activeSection === "services" ? "active" : ""}>
                Services
                </a>

                <a href="#about" className={activeSection === "about" ? "active" : ""}>
                À propos
                </a>

                <a href="#contact" className={activeSection === "contact" ? "active" : ""}>
                Contact
                </a>

                <button className="login-btn" onClick={() => setShowLogin(true)}>
                Connexion
                </button>
            </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-overlay">
          <h2>Bienvenue chez SmartIA</h2>
          <p>
            Votre assistant intelligent basé sur l’IA pour rechercher,
            comprendre et répondre à vos questions en temps réel.
          </p>
          <button className="hero-btn" onClick={() => setShowRAG(true)}>
            Commencez
          </button>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section services" id="services">
            <h1>Nos services</h1>
            <div className="cards-grid">
                <div className="card">🧑🏻‍💻 Développement Web (Front & Back)</div>
                <div className="card">👾 Logiciels & Plateformes SaaS</div>
                <div className="card">📳 Développement Mobile</div>
                <div className="card">🛖 Architecture Technique</div>
                <div className="card">🔐 Sécurité Informatique</div>
                <div className="card">🤖 Analyse & Solutions IA</div>
                <div className="card">⚡ Conseil & Ingénierie</div>
                <div className="card">📚 Maintenance & Optimisation</div>
            </div>
        </section>  

        {/* ABOUT */}
        <section className="section about" id="about">
        <h1>À propos de SmartIA</h1>

        <div className="about-content">
            <p>
            <strong>SmartIA</strong> est une entreprise spécialisée dans les solutions
            d’intelligence artificielle, le développement logiciel et
            l’accompagnement technologique.
            </p>

            <p>
            Notre mission est d’aider les entreprises à exploiter le potentiel
            du numérique grâce à des solutions fiables, sécurisées et innovantes.
            </p>

            <div className="about-stats">
            <div><span>+5</span> ans d’expertise</div>
            <div><span>+30</span> projets réalisés</div>
            <div><span>100%</span> satisfaction client</div>
            </div>
        </div>
        </section>

        {/* CONTACT */}
        <section className="section contact" id="contact">
        <h1>Contactez-nous</h1>

        <div className="contact-grid">
            <div className="contact-card">
            📧 <strong>Email</strong>
            <p>contact@smartia.com</p>
            </div>

            <div className="contact-card">
            📞 <strong>Téléphone</strong>
            <p>+212 6 00 00 00 00</p>
            </div>

            <div className="contact-card">
            📍 <strong>Adresse</strong>
            <p>Maroc</p>
            </div>
        </div>
        </section>


      {/* FOOTER */}
      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} SmartIA – Tous droits réservés
      </footer>

      {/* ROBOT */}
      <RobotButton
        onClick={() => setShowRAG(true)}
        className="robot-btn"  // ← ajoute cette classe
      />

      {/* MODALS */}
      {showRAG && <VisitorRAG onClose={() => setShowRAG(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}

    </div>
  );
}
