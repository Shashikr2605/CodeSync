// App.js — root orchestrator: state, hooks wiring, and page routing
import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";

import { WARM_THEME, STARTER_CODE } from "./config/editorConfig";
import { generateId, getInitials } from "./utils/helpers";
import { useSocket } from "./hooks/useSocket";
import { useEditorDecorations } from "./hooks/useEditorDecorations";
import { useChat } from "./hooks/useChat";
import { useVoiceChat } from "./hooks/useVoiceChat";
import { useCodeRunner } from "./hooks/useCodeRunner";
import JoinPage from "./pages/JoinPage";
import EditorPage from "./pages/EditorPage";

export default function App() {
  // ── State ───────────────────────────────────────────────────────
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [myColor, setMyColor] = useState("#E8863A");
  const [code, setCode] = useState(STARTER_CODE);
  const [users, setUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState("javascript");

  // ── Refs ────────────────────────────────────────────────────────
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const cursorThrottle = useRef(null);

  // ── Core Hooks ──────────────────────────────────────────────────
  const socketRef = useSocket({
    joined, roomId, username,
    setCode, setMyColor, setUsers, setRemoteCursors, setLanguage,
  });

  useEditorDecorations({ editorRef, monacoRef, remoteCursors, decorationsRef });

  // ── Feature Hooks ───────────────────────────────────────────────
  const { messages, sendMessage } = useChat({ socketRef, roomId, joined });

  const { isInVoice, isMuted, joinVoice, leaveVoice, toggleMute, participants: voiceParticipants } =
    useVoiceChat({ socketRef, roomId, joined });

  const { runCode, output, isRunning, error: codeError, clearOutput, stdin, setStdin } =
    useCodeRunner({ socketRef, joined });

  // ── Cursor color overlay ─────────────────────────────────────────
  useEffect(() => {
    const styleEl = document.getElementById("remote-cursor-styles");
    if (!styleEl) return;
    const rules = Object.values(remoteCursors)
      .map(({ socketId, color }) => {
        const safe = socketId.replace(/[^a-zA-Z0-9]/g, "");
        return `
          .cursor-${safe} { border-left: 2px solid ${color} !important; }
          .cursor-${safe}-label::after { background: ${color} !important; }
        `;
      })
      .join("\n");
    styleEl.textContent = rules;
  }, [remoteCursors]);

  // ── Editor mount ─────────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme("warmDark", WARM_THEME);
    monaco.editor.setTheme("warmDark");

    const styleEl = document.createElement("style");
    styleEl.id = "remote-cursor-styles";
    document.head.appendChild(styleEl);

    editor.onDidChangeCursorPosition((e) => {
      if (!socketRef.current) return;
      if (cursorThrottle.current) clearTimeout(cursorThrottle.current);
      cursorThrottle.current = setTimeout(() => {
        const selection = editor.getSelection();
        socketRef.current.emit("cursor_move", {
          roomId,
          line: e.position.lineNumber,
          column: e.position.column,
          selection: selection
            ? {
              startLine: selection.startLineNumber,
              startCol: selection.startColumn,
              endLine: selection.endLineNumber,
              endCol: selection.endColumn,
            }
            : null,
        });
      }, 30);
    });
  }, [roomId]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCodeChange = (newCode) => {
    setCode(newCode ?? "");
    if (socketRef.current) {
      socketRef.current.emit("send_code", { roomId, code: newCode ?? "" });
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (socketRef.current) {
      socketRef.current.emit("language:change", { roomId, language: newLang });
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    const room = roomInput.trim() || generateId();
    setRoomId(room);
    setJoined(true);
  };

  const handleCreateRoom = () => setRoomInput(generateId());

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ───────────────────────────────────────────────────────
  if (!joined) {
    return (
      <JoinPage
        username={username}
        setUsername={setUsername}
        roomInput={roomInput}
        setRoomInput={setRoomInput}
        handleJoin={handleJoin}
        handleCreateRoom={handleCreateRoom}
      />
    );
  }

  const allUsers = [{ socketId: "me", username, color: myColor }, ...users];

  return (
    <EditorPage
      // Editor / room
      roomId={roomId}
      copied={copied}
      handleCopyRoom={handleCopyRoom}
      language={language}
      setLanguage={handleLanguageChange}
      allUsers={allUsers}
      getInitials={getInitials}
      remoteCursors={remoteCursors}
      myColor={myColor}
      username={username}
      code={code}
      handleCodeChange={handleCodeChange}
      handleEditorMount={handleEditorMount}
      editorRef={editorRef}
      monacoRef={monacoRef}
      // Chat
      messages={messages}
      sendMessage={sendMessage}
      // Voice
      isInVoice={isInVoice}
      isMuted={isMuted}
      joinVoice={joinVoice}
      leaveVoice={leaveVoice}
      toggleMute={toggleMute}
      voiceParticipants={voiceParticipants}
      // Code runner
      runCode={runCode}
      output={output}
      isRunning={isRunning}
      codeError={codeError}
      clearOutput={clearOutput}
      stdin={stdin}
      setStdin={setStdin}
    />
  );
}