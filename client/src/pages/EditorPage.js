// Page: main collaborative editor screen with Chat, Voice, and Output panels
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

import TopBar      from "../components/TopBar";
import CursorPanel from "../components/CursorPanel";
import CursorLabel from "../components/CursorLabel";
import StatusBar   from "../components/StatusBar";
import ChatPanel   from "../components/Chat/ChatPanel";
import VoicePanel  from "../components/VoiceChat/VoicePanel";
import RunButton   from "../components/Toolbar/RunButton";
import OutputPanel from "../components/Output/OutputPanel";

export default function EditorPage({
  // Editor / room props
  roomId, copied, handleCopyRoom,
  language, setLanguage,
  allUsers, getInitials,
  remoteCursors, myColor, username,
  code, handleCodeChange, handleEditorMount,
  editorRef, monacoRef,
  // Chat props
  messages, sendMessage,
  // Voice props
  isInVoice, isMuted, joinVoice, leaveVoice, toggleMute, voiceParticipants,
  // Code runner props
  runCode, output, isRunning, codeError, clearOutput,
}) {
  const [sidebarTab,   setSidebarTab]   = useState("chat"); // "chat" | "voice"
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [outputOpen,   setOutputOpen]   = useState(false);

  // Auto-open output panel when execution finishes
  useEffect(() => {
    if (!isRunning && (output || codeError)) {
      setOutputOpen(true);
    }
  }, [isRunning, output, codeError]);

  return (
    <div className="app">
      {/* ── Top Bar ── */}
      <header className="topbar">
        <TopBar
          roomId={roomId}
          copied={copied}
          handleCopyRoom={handleCopyRoom}
          language={language}
          setLanguage={setLanguage}
          allUsers={allUsers}
          getInitials={getInitials}
        />
        <div className="sep" />
        <RunButton
          language={language}
          onRun={() => {
            setOutputOpen(true);
            runCode({ code, language, roomId });
          }}
          isRunning={isRunning}
        />
        <button
          className="btn-ghost-sm sidebar-toggle-btn"
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? "⇥" : "⇤"}
        </button>
      </header>

      {/* ── Cursor Panel ── */}
      <CursorPanel remoteCursors={remoteCursors} myColor={myColor} username={username} />

      {/* ── Main Content Row ── */}
      <div className="main-row">
        {/* Center: Editor */}
        <div className="editor-col">
          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              theme="warmDark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                fontLigatures: true,
                lineHeight: 22,
                minimap: { enabled: true, scale: 1 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                renderLineHighlight: "all",
                roundedSelection: true,
                padding: { top: 16, bottom: 16 },
                tabSize: 2,
                wordWrap: "on",
                suggest: { showIcons: true },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
            />
            {Object.values(remoteCursors).map((c) => (
              <CursorLabel key={c.socketId} cursor={c} editor={editorRef.current} monaco={monacoRef.current} />
            ))}
          </div>

          {/* Output Panel (bottom of editor col) */}
          <OutputPanel
            output={output}
            error={codeError}
            isRunning={isRunning}
            clearOutput={clearOutput}
            isOpen={outputOpen}
            onToggle={() => setOutputOpen((o) => !o)}
          />
        </div>

        {/* Right Sidebar */}
        {sidebarOpen && (
          <div className="sidebar">
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab ${sidebarTab === "chat"  ? "sidebar-tab-active" : ""}`}
                onClick={() => setSidebarTab("chat")}
              >
                💬 Chat
              </button>
              <button
                className={`sidebar-tab ${sidebarTab === "voice" ? "sidebar-tab-active" : ""}`}
                onClick={() => setSidebarTab("voice")}
              >
                🎙 Voice {isInVoice && <span className="voice-live-dot" />}
              </button>
            </div>

            {sidebarTab === "chat" && (
              <ChatPanel
                messages={messages}
                sendMessage={sendMessage}
                currentUsername={username}
              />
            )}
            {sidebarTab === "voice" && (
              <VoicePanel
                isInVoice={isInVoice}
                isMuted={isMuted}
                joinVoice={joinVoice}
                leaveVoice={leaveVoice}
                toggleMute={toggleMute}
                participants={voiceParticipants}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <StatusBar language={language} allUsers={allUsers} />
    </div>
  );
}
