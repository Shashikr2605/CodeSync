// Component: text chat panel (View layer)
import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ messages, sendMessage, currentUsername }) {
  const [text, setText]     = useState("");
  const bottomRef           = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(text);
    setText("");
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg ${msg.username === currentUsername ? "chat-msg-me" : ""}`}
          >
            <div className="chat-msg-header">
              <span className="chat-msg-user">{msg.username}</span>
              <span className="chat-msg-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="chat-msg-body">{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
        />
        <button className="chat-send-btn" type="submit" disabled={!text.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
