import { useState } from "react";
import "../App.css";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import LoginModal from "../pages/LoginModal";
import RegisterModal from "../pages/RegisterModal";

export default function Dashboard() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  //const [messages, setMessages] = useState([]); // <- état pour les messages

  const token = localStorage.getItem("token");

  return (
    <div className="dashboard">
        {token && <Sidebar />}

        <div className="main">
            <div className="top-bar">
            {!token && (
                <>
                <button onClick={() => setShowLogin(true)}>Se connecter</button>
                <button onClick={() => setShowRegister(true)}>S’inscrire</button>
                </>
            )}

            
            </div>

            <ChatWindow />
        </div>

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
        </div>

  );
}
