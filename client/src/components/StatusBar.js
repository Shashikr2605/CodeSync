// Component: bottom status bar (View layer)
export default function StatusBar({ language, allUsers }) {
  return (
    <footer className="statusbar">
      <span className="status-brand">✦ CodeSync</span>
      <span className="status-sep">|</span>
      <span>{language}</span>
      <span className="status-sep">|</span>
      <span className="live-chip">
        <span className="pulse" />
        Live
      </span>
      <div className="spacer" />
      <span>{allUsers.length} collaborator{allUsers.length !== 1 ? "s" : ""}</span>
    </footer>
  );
}
