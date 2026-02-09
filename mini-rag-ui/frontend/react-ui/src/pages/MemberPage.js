import { useState } from "react";
import Navbar from "../components/Navbar";
import MemberSidebar from "../components/MemberSidebar";
import ChatWindowPrivate from "../components/ChatWindowPrivate";
import "../assets/css/layout.css";

export default function MemberPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">

      {/* HEADER GLOBAL */}
      <Navbar toggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* CONTENU */}
      <div className="content-row">
        <MemberSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <ChatWindowPrivate />
      </div>

    </div>
  );
}

