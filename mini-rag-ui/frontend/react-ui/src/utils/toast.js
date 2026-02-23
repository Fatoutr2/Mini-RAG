import { useEffect, useState } from "react";

const listeners = new Set();
let nextId = 1;

function emit(message, type = "info") {
  const item = {
    id: nextId++,
    message,
    type,
  };

  listeners.forEach((listener) => listener(item));
}

export const toast = {
  success: (message) => emit(message, "success"),
  error: (message) => emit(message, "error"),
  message: (message) => emit(message, "info"),
};

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (item) => {
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      }, 3500);
    };

    listeners.add(onToast);
    return () => listeners.delete(onToast);
  }, []);

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 5000, display: "grid", gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            minWidth: 240,
            maxWidth: 360,
            padding: "10px 12px",
            borderRadius: 10,
            border: item.type === "error" ? "1px solid rgba(244,63,94,.5)" : "1px solid rgba(16,185,129,.45)",
            background: item.type === "error" ? "rgba(127,29,29,.95)" : "rgba(6,78,59,.95)",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(0,0,0,.25)",
            fontSize: 13,
          }}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}