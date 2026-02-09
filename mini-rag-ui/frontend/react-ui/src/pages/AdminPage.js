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

  const refreshThreads = async (search = "") => {
    const data = await listThreads(search);
    setThreads(data);

    if (!activeThreadId && data.length > 0) {
      setActiveThreadId(data[0].id);
    }
    if (activeThreadId && !data.some((t) => t.id === activeThreadId)) {
      setActiveThreadId(data.length ? data[0].id : null);
    }
  };

  useEffect(() => {
    refreshThreads("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = async () => {
    const t = await createThread();
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(t.id);
    setSidebarOpen(false);
  };

  const handleSearch = async (value) => {
    setSearchValue(value);
    await refreshThreads(value);
  };

  const handleRename = async (threadId, title) => {
    const updated = await renameThread(threadId, title);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
  };

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
          onSelectThread={setActiveThreadId}
          onRenameThread={handleRename}
          onOpenAccess={() => console.log("Accès")}
          onOpenMembers={() => console.log("Membres")}
          onOpenAdmins={() => console.log("Admins")}
        />

        <ChatWindowPrivate
          sidebarOpen={sidebarOpen}
          activeThreadId={activeThreadId}
          onThreadAutoTitleRefresh={() => refreshThreads(searchValue)}
        />
      </div>
    </div>
  );
}
