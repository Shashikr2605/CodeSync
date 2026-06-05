// Hook: manages socket connection and all real-time events (Controller layer)
import { useEffect, useRef } from "react";
import { getSocket, disconnectSocket } from "../services/socketService";

export function useSocket({ joined, roomId, username, setCode, setMyColor, setUsers, setRemoteCursors, setLanguage }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!joined) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("join_room", { roomId, username });

    socket.on("assigned_color", ({ color }) => setMyColor(color));

    socket.on("receive_code", (newCode) => setCode(newCode));

    socket.on("room_users", (existingUsers) => setUsers(existingUsers));

    socket.on("user_joined", ({ socketId, username: uname, color }) => {
      setUsers((prev) => {
        if (prev.find((u) => u.socketId === socketId)) return prev;
        return [...prev, { socketId, username: uname, color }];
      });
    });

    socket.on("user_left", ({ socketId }) => {
      setUsers((prev) => prev.filter((u) => u.socketId !== socketId));
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on("remote_cursor", (data) => {
      setRemoteCursors((prev) => ({ ...prev, [data.socketId]: data }));
    });

    // Sync language changes from other users
    socket.on("language:changed", ({ language }) => {
      if (setLanguage) setLanguage(language);
    });

    return () => disconnectSocket();
  }, [joined, roomId, username]);

  return socketRef;
}