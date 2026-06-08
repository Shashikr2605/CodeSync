// Hook: code runner — emits run event and receives output (Controller layer)
import { useEffect, useRef, useState } from "react";

export function useCodeRunner({ socketRef, joined }) {
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [stdin, setStdin] = useState("");

  // Use a ref to track whether listeners are attached to avoid stale closures
  const listenersAttached = useRef(false);

  useEffect(() => {
    // Wait until socket is actually connected
    const attach = () => {
      const socket = socketRef.current;
      if (!socket || listenersAttached.current) return;

      listenersAttached.current = true;

      socket.on("code:output", (result) => {
        setOutput(result);
        setIsRunning(false);
        setError(null);
      });

      socket.on("code:error", ({ message }) => {
        setError(message);
        setIsRunning(false);
        setOutput(null);
      });
    };

    // Try immediately, then retry once after a tick (socket may not be set yet)
    attach();
    const timer = setTimeout(attach, 100);

    return () => {
      clearTimeout(timer);
      const socket = socketRef.current;
      if (socket) {
        socket.off("code:output");
        socket.off("code:error");
      }
      listenersAttached.current = false;
    };
  }, [joined]);

  function runCode({ code, language, roomId, stdin = "" }) {
    if (!socketRef.current || isRunning) return;
    setIsRunning(true);
    setError(null);
    setOutput(null);
    socketRef.current.emit("code:run", { code, language, roomId, stdin });
  }

  function clearOutput() {
    setOutput(null);
    setError(null);
  }

  return { runCode, output, isRunning, error, clearOutput, stdin, setStdin };
}