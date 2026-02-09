import "../assets/css/navbar.css";

export default function Navbar({ sidebarOpen, setSidebarOpen, toggle }) {
  return (
    <div className="navbar">
      <button className="menu-btn" onClick={toggle}>☰</button>
      <div
        className="nav-title"
        onClick={() => window.location.reload()}
      >
        (•‿•) SmartIA
      </div>
    </div>
  );
}
