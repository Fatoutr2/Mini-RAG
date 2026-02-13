import { useEffect, useState } from "react";
import ChatWindowPrivate from "../components/ChatWindowPrivate";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import {
  listThreads,
  createThread,
  renameThread,
  deleteThread,
} from "../services/chatService";
import { uploadDocument } from "../services/uploadService";
import "../assets/css/layout.css";
import "../assets/css/admin-pages.css";


export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [chatMode, setChatMode] = useState("rag");

  const refreshThreads = async (search = "") => {
    const data = await listThreads(search);
    setThreads(data);

    setActiveThreadId((prevId) => {
      if (!prevId && data.length > 0) return data[0].id;
      if (prevId && !data.some((t) => t.id === prevId)) return data.length ? data[0].id : null;
      return prevId;
    });
  };

  useEffect(() => {
    refreshThreads("");
  }, []);

  const handleNewChat = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (creatingThread) return;

    setCreatingThread(true);
    try {
      const t = await createThread();
      setThreads((prev) => [t, ...prev]);
      setActiveThreadId(t.id);
      setSidebarOpen(false);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleSearch = async (value) => {
    setSearchValue(value);
    await refreshThreads(value);
  };

  const handleRename = async (threadId, title) => {
    const updated = await renameThread(threadId, title);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
  };

  const handleDelete = async (threadId) => {
    await deleteThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    setActiveThreadId((prevId) => (prevId === threadId ? null : prevId));
  };

  return (
    <div className="app-layout">
      <Navbar role="admin" toggle={() => setSidebarOpen((v) => !v)} chatMode={chatMode} onChatModeChange={setChatMode} />

      <div className="content-row">
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          creatingThread={creatingThread}
          onSearch={handleSearch}
          onSelectThread={setActiveThreadId}
          onRenameThread={handleRename}
          onDeleteThread={handleDelete}
          onOpenAccess={() => console.log("Accès")}
          onOpenMembers={() => console.log("Membres")}
          onOpenAdmins={() => console.log("Admins")}
          onUploadFile={uploadDocument}
        />

        <ChatWindowPrivate
          sidebarOpen={sidebarOpen}
          activeThreadId={activeThreadId}
          onThreadAutoTitleRefresh={() => refreshThreads(searchValue)}
          mode={chatMode}
        />
      </div>
    </div>
  );
}
