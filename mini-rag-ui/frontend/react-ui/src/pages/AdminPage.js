import { useEffect, useState } from "react";
import ChatWindowPrivate from "../components/ChatWindowPrivate";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import {
  listThreads,
  createThread,
  renameThread,
} from "../services/chatService";
import "../assets/css/layout.css";

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  // Optionnel: état pour ouvrir vos panneaux admin
  const [adminPanel, setAdminPanel] = useState(null); // "access" | "members" | "admins" | null

  const refreshThreads = async (search = "") => {
    try {
      const data = await listThreads(search);
      setThreads(data);

      // si aucun thread actif, prendre le plus récent
      if (!activeThreadId && data.length > 0) {
        setActiveThreadId(data[0].id);
      }

      // si thread actif supprimé/absent après filtre, fallback
      if (activeThreadId && !data.some((t) => t.id === activeThreadId)) {
        setActiveThreadId(data.length ? data[0].id : null);
      }
    } catch (err) {
      console.error("Erreur chargement threads:", err);
    }
  };

  useEffect(() => {
    refreshThreads("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = async () => {
    try {
      const newThread = await createThread();
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      setSidebarOpen(false); // pratique sur mobile
    } catch (err) {
      console.error("Erreur création thread:", err);
    }
  };

  const handleSearch = async (value) => {
    setSearchValue(value);
    await refreshThreads(value);
  };

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    setSidebarOpen(false); // pratique sur mobile
  };

  const handleRenameThread = async (threadId, title) => {
    try {
      const updated = await renameThread(threadId, title);
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      console.error("Erreur renommage:", err);
    }
  };

  // Callbacks boutons admin
  const handleOpenAccess = () => setAdminPanel("access");
  const handleOpenMembers = () => setAdminPanel("members");
  const handleOpenAdmins = () => setAdminPanel("admins");

  return (
    <div className="app-layout">
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} />

      <div className="content-row">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          onSearch={handleSearch}
          onSelectThread={handleSelectThread}
          onRenameThread={handleRenameThread}
          onOpenAccess={handleOpenAccess}
          onOpenMembers={handleOpenMembers}
          onOpenAdmins={handleOpenAdmins}
        />

        <ChatWindowPrivate
          sidebarOpen={sidebarOpen}
          activeThreadId={activeThreadId}
          onThreadAutoTitleRefresh={() => refreshThreads(searchValue)}
        />
      </div>

      {/* Optionnel: placeholder visuel pour vos panneaux admin */}
      {adminPanel && (
        <div style={{ position: "fixed", right: 20, bottom: 20, background: "#222", color: "#fff", padding: 12, borderRadius: 8 }}>
          Panneau admin actif : <strong>{adminPanel}</strong>
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setAdminPanel(null)}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
