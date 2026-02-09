import { useState } from "react";
import ChatWindowPrivate from "../components/ChatWindowPrivate";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import "../assets/css/layout.css";


export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">

      {/* HEADER GLOBAL */}
      <Navbar toggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* CONTENU */}
      <div className="content-row">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <ChatWindowPrivate />
      </div>

    </div>
  );
}