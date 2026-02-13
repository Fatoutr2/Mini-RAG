import "../assets/css/navbar.css";

export default function Navbar({ toggle, role = "member", chatMode, onChatModeChange }) {
  const showModeSwitch = typeof onChatModeChange === "function";

  return (
    <header className="navbar">
      <div className="nav-left">
        <button className="menu-btn" onClick={toggle}>☰</button>
        <div className="nav-brand" onClick={() => window.location.reload()}>
          (•‿•) SmartIA
        </div>
      </div>
      
      {showModeSwitch && (
        <div className="nav-center">
          <button
            className={`mode-chip ${chatMode === "rag" ? "active" : ""}`}
            onClick={() => onChatModeChange("rag")}
            type="button"
          >
            📚 RAG
          </button>
          <button
            className={`mode-chip ${chatMode === "chat" ? "active" : ""}`}
            onClick={() => onChatModeChange("chat")}
            type="button"
          >
            💬 Chat
          </button>
        </div>
      )}

      <div className="nav-right">
        <span className="role-badge">{role === "admin" ? "Admin" : "Membre"}</span>
      </div>
    </header>
  );
}
