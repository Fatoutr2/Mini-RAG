import "../assets/css/navbar.css";

export default function Navbar({ toggle, role = "member" }) {
  return (
    <header className="navbar">
      <div className="nav-left">
        <button className="menu-btn" onClick={toggle}>☰</button>
        <div className="nav-brand" onClick={() => window.location.reload()}>
          (•‿•) SmartIA
        </div>
      </div>

      <div className="nav-right">
        <span className="role-badge">{role === "admin" ? "Admin" : "Membre"}</span>
      </div>
    </header>
  );
}
