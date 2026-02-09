import { useState } from "react";
import "../assets/css/Index.css";
import ChatWindowVisitor from "../components/ChatWindowVisitor";

export default function VisitorRAG({ onClose }) {

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>Assistant virtuel</h3>

        <ChatWindowVisitor
          visitor={true}
        />
      </div>
    </div>
  );
}
