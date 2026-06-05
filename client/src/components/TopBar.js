// Component: top navigation bar contents (View layer)
export default function TopBar({ roomId, copied, handleCopyRoom, language, setLanguage, allUsers, getInitials }) {
  return (
    <>
      <div className="logo">
        <span className="logo-icon">✦</span>
        CodeSync
      </div>
      <div className="sep" />

      <div className="room-pill" onClick={handleCopyRoom} title="Click to copy">
        <span className="dot-green" />
        <span className="room-label">Room:</span>
        <span className="room-id">{roomId}</span>
        <span className="copy-icon">{copied ? "✓" : "⎘"}</span>
      </div>

      <div className="sep" />

      <select
        className="lang-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="json">JSON</option>
        <option value="css">CSS</option>
        <option value="html">HTML</option>
      </select>

      <div className="spacer" />

      <div className="users-row">
        {allUsers.slice(0, 5).map((u, i) => (
          <div
            key={u.socketId}
            className="avatar"
            style={{
              background: u.color,
              color: "#fff",
              zIndex: 10 - i,
              marginLeft: i === 0 ? 0 : -8,
              border: "2px solid #1A120B",
            }}
            title={u.username + (u.socketId === "me" ? " (you)" : "")}
          >
            {getInitials(u.username)}
          </div>
        ))}
        {allUsers.length > 5 && (
          <div className="avatar-overflow">+{allUsers.length - 5}</div>
        )}
        <span className="user-count">{allUsers.length} online</span>
      </div>
    </>

  );
}
