import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import MemberSidebar from "../components/MemberSidebar";
import ChatWindowPrivate from "../components/ChatWindowPrivate";
import { listThreads, createThread, renameThread, deleteThread, setThreadMode } from "../services/chatService";
import { uploadDocument } from "../services/uploadService";
import "../assets/css/layout.css";

export default function MemberPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [search, setSearch] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [chatMode, setChatMode] = useState("rag");

  const refreshThreads = async (q = "") => {
    const data = await listThreads(q);
    setThreads(data);
    setActiveThreadId((prevId) => {
      if (!prevId && data.length) return data[0].id;
      if (prevId && !data.some((t) => t.id === prevId)) return data.length ? data[0].id : null;
      return prevId;
    });
  };

  useEffect(() => {
    refreshThreads("");
  }, []);

  useEffect(() => {
    const active = threads.find((t) => t.id === activeThreadId);
    if (active?.mode) setChatMode(String(active.mode).toLowerCase());
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    setThreadMode(activeThreadId, chatMode).catch(() => {});
  }, [activeThreadId, chatMode]);

  const handleNewChat = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (creatingThread) return;

    setCreatingThread(true);
    try {
      const t = await createThread(chatMode);      setThreads((prev) => [t, ...prev]);
      setActiveThreadId(t.id);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleRename = async (id, title) => {
    const updated = await renameThread(id, title);
    setThreads((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDelete = async (id) => {
    await deleteThread(id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setActiveThreadId((prevId) => (prevId === id ? null : prevId));
  };

  const handleSearch = (value) => {
    setSearch(value);
    refreshThreads(value);
  };

  return (
    <div className="app-layout">
      <Navbar role="member" toggle={() => setSidebarOpen(!sidebarOpen)} chatMode={chatMode} onChatModeChange={setChatMode} />
      <div className="content-row">
        <MemberSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChat={handleNewChat}
          creatingThread={creatingThread}
          onSearch={handleSearch}
          onSelectThread={(id) => {
            const th = threads.find((x) => x.id === id);
            setChatMode((th?.mode || "rag").toLowerCase());
            setActiveThreadId(id);
          }}
          onRenameThread={handleRename}
          onDeleteThread={handleDelete}
          onUploadFile={(file) => uploadDocument(file, "private")}
        />
        <ChatWindowPrivate
          sidebarOpen={sidebarOpen}
          activeThreadId={activeThreadId}
          onThreadAutoTitleRefresh={() => refreshThreads(search)}
          mode={chatMode}
        />
      </div>
    </div>
  );
}
