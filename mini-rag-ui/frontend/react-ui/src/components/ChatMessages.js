// src/components/ChatMessages.js
import React from "react";
import "../App.css";

export default function ChatMessages({ messages }) {
  return (
    <div className="chat-messages">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`message ${msg.type === "user" ? "user-msg" : "bot-msg"}`}
        >
          {/* Affiche le texte */}
          <p>{msg.text}</p>

          {/* Affiche la source si elle existe */}
          {msg.source && <span className="source">({msg.source})</span>}
        </div>
      ))}
    </div>
  );
}
