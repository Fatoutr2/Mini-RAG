import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import MemberSidebar from "../components/MemberSidebar";
import ChatWindowPrivate from "../components/ChatWindowPrivate";
import { listThreads, createThread, renameThread } from "../services/chatService";
import "../assets/css/layout.css";

export default function MemberPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [search, setSearch] = useState("");

  const refreshThreads = async (q = "") => {
    const data = await listThreads(q);
    setThreads(data);
    if (!activeThreadId && data.length) setActiveThreadId(data[0].id);
  };

  useEffect(() => { refreshThreads(""); }, []);

  const handleNewChat = async () => {
    const t = await createThread();
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(t.id);
  };

  const handleRename = async (id, title) => {
    const updated = await renameThread(id, title);
    setThreads((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleSearch = (value) => {
    setSearch(value);
    refreshThreads(value);
  };

  return (
    <div className="app-layout">
      <Navbar role="member" toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="content-row">
        <MemberSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          onSearch={handleSearch}
          onSelectThread={setActiveThreadId}
          onRenameThread={handleRename}
        />
        <ChatWindowPrivate sidebarOpen={sidebarOpen} activeThreadId={activeThreadId} />
      </div>
    </div>
  );
}
