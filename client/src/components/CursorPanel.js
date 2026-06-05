// Component: live cursor position panel (View layer)
export default function CursorPanel({ remoteCursors, myColor, username }) {
  return (
    <div className="cursor-panel">
      {Object.values(remoteCursors).map((c) => (
        <div key={c.socketId} className="cursor-chip">
          <span className="cursor-chip-dot" style={{ background: c.color }} />
          <span className="cursor-chip-name">{c.username}</span>
          <span className="cursor-chip-pos">
            Ln {c.line}, Col {c.column}
          </span>
        </div>
      ))}
      <div className="cursor-chip cursor-chip-me">
        <span className="cursor-chip-dot" style={{ background: myColor }} />
        <span className="cursor-chip-name">{username} (you)</span>
      </div>
    </div>
  );
}
