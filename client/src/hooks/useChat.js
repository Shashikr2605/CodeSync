// Hook: text chat — connects to chat socket events (Controller layer)
import { useEffect, useRef, useState } from "react";

export function useChat({ socketRef, roomId, joined }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!joined || !socketRef.current) return;
    const socket = socketRef.current;

    // Request history when joining
    socket.emit("chat:history", roomId);

    socket.on("chat:history", (history) => setMessages(history));

    socket.on("chat:receive", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat:history");
      socket.off("chat:receive");
    };
  }, [joined, roomId, socketRef.current]);

  function sendMessage(text) {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:send", { roomId, text });
  }

  return { messages, sendMessage };
}
