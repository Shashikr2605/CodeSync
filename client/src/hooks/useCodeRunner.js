// Hook: code runner — emits run event and receives output (Controller layer)
import { useEffect, useRef, useState } from "react";

export function useCodeRunner({ socketRef, joined }) {
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [stdin, setStdin] = useState("");
  const [runnerName, setRunnerName] = useState(null); // who triggered the run

  const listenersAttached = useRef(false);

  useEffect(() => {
    const attach = () => {
      const socket = socketRef.current;
      if (!socket || listenersAttached.current) return;

      listenersAttached.current = true;

      // ── code:running broadcast from server (all room members receive this) ──
      socket.on("code:running", ({ username, stdin: remoteStin }) => {
        setIsRunning(true);
        setError(null);
        setOutput(null);
        setRunnerName(username);
        // Sync the stdin that was used so all collaborators see it
        if (remoteStin !== undefined) setStdin(remoteStin);
      });

      // ── code:output broadcast from server ────────────────────────────────
      socket.on("code:output", (result) => {
        setOutput(result);
        setIsRunning(false);
        setError(null);
        setRunnerName(null);
      });

      // ── code:error broadcast from server ─────────────────────────────────
      socket.on("code:error", ({ message }) => {
        setError(message);
        setIsRunning(false);
        setOutput(null);
        setRunnerName(null);
      });
    };

    attach();
    const timer = setTimeout(attach, 100);

    return () => {
      clearTimeout(timer);
      const socket = socketRef.current;
      if (socket) {
        socket.off("code:running");
        socket.off("code:output");
        socket.off("code:error");
      }
      listenersAttached.current = false;
    };
  }, [joined]);

  function runCode({ code, language, roomId, stdin = "", username = "" }) {
    if (!socketRef.current || isRunning) return;
    // Don't set isRunning locally — the server will broadcast code:running back
    // to the whole room (including us), which will set it
    setError(null);
    setOutput(null);
    socketRef.current.emit("code:run", { code, language, roomId, stdin, username });
  }

  function clearOutput() {
    setOutput(null);
    setError(null);
    setRunnerName(null);
  }

  return { runCode, output, isRunning, error, clearOutput, stdin, setStdin, runnerName };
}