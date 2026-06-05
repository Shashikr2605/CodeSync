// Component: voice chat panel (View layer)
export default function VoicePanel({ isInVoice, isMuted, joinVoice, leaveVoice, toggleMute, participants }) {
  return (
    <div className="voice-panel">
      <div className="voice-participants">
        {participants.length === 0 && !isInVoice && (
          <div className="voice-empty">No one in voice. Join to start talking!</div>
        )}
        {isInVoice && (
          <div className="voice-participant voice-participant-me">
            <div className={`voice-avatar-wrap ${isMuted ? "" : "speaking-self"}`}>
              <div className="voice-avatar">🎙</div>
            </div>
            <span className="voice-name">You {isMuted ? "(muted)" : ""}</span>
          </div>
        )}
        {participants.map((p) => (
          <div key={p.socketId} className="voice-participant">
            <div className={`voice-avatar-wrap ${p.speaking ? "speaking" : ""}`}>
              <div className="voice-avatar">🎧</div>
              {p.speaking && <span className="speaking-pulse" />}
            </div>
            <span className="voice-name">{p.socketId.slice(0, 6)}</span>
          </div>
        ))}
      </div>

      <div className="voice-controls">
        {!isInVoice ? (
          <button className="btn-voice-join" onClick={joinVoice}>
            📞 Join Voice
          </button>
        ) : (
          <>
            <button
              className={`btn-voice-mute ${isMuted ? "btn-voice-muted" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇 Unmute" : "🎙 Mute"}
            </button>
            <button className="btn-voice-leave" onClick={leaveVoice}>
              📵 Leave
            </button>
          </>
        )}
      </div>
    </div>
  );
}
