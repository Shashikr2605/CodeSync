// Page: join / create room screen (View layer)
export default function JoinPage({ username, setUsername, roomInput, setRoomInput, handleJoin, handleCreateRoom }) {
  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-logo">
          <span className="join-logo-icon">✦</span>
          <span>CodeSync</span>
        </div>
        <p className="join-subtitle">Real-time collaborative code editor</p>

        <form onSubmit={handleJoin} className="join-form">
          <div className="field-group">
            <label>Your name</label>
            <input
              type="text"
              placeholder="e.g. Shashank"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="field-group">
            <label>Room ID <span className="optional">(leave blank to create new)</span></label>
            <div className="room-input-row">
              <input
                type="text"
                placeholder="e.g. ALPHA-7F3D"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              />
              <button type="button" className="btn-ghost-sm" onClick={handleCreateRoom}>
                Generate
              </button>
            </div>
          </div>

          <button type="submit" className="btn-join">
            {roomInput ? "Join Room →" : "Create Room →"}
          </button>
        </form>

        <div className="join-features">
          <div className="feat"><span>⚡</span> Live sync</div>
          <div className="feat"><span>👥</span> Multi-user cursors</div>
          <div className="feat"><span>🎨</span> Syntax highlighting</div>
        </div>
      </div>
    </div>
  );
}
