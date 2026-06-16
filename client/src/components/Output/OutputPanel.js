// Component: terminal-style output panel with synced stdin and run-state (View layer)
export default function OutputPanel({
  output, error, isRunning, clearOutput,
  isOpen, onToggle,
  stdin, setStdin,
  runnerName,   // who triggered the current run (null if idle)
  myUsername,   // the local user's name
}) {
  const isRemoteRun = isRunning && runnerName && runnerName !== myUsername;

  return (
    <div className={`output-panel ${isOpen ? "output-panel-open" : ""}`}>
      <div className="output-header" onClick={onToggle}>
        <span className="output-title">
          <span className="output-icon">⬛</span> Output
          {isRunning && <span className="output-running-badge">Running…</span>}
          {error && <span className="output-error-badge">Runtime Error</span>}
          {output && !error && <span className="output-ok-badge">{output.status}</span>}
        </span>
        <div className="output-header-actions">
          {isRunning && runnerName && (
            <span className="runner-badge">▶ {runnerName}</span>
          )}
          {(output || error) && !isRunning && (
            <button
              className="output-clear-btn"
              onClick={(e) => { e.stopPropagation(); clearOutput(); }}
            >
              Clear
            </button>
          )}
          <span className="output-toggle-icon">{isOpen ? "▼" : "▲"}</span>
        </div>
      </div>

      {isOpen && (
        <div className="output-body">
          {/* Stdin input — synced across room, read-only if someone else is running */}
          <div className="output-section">
            <div className="output-section-label output-label-blue">
              Stdin Input
              {isRemoteRun && (
                <span className="stdin-synced-tag"> · synced from {runnerName}</span>
              )}
            </div>
            <textarea
              className={`output-stdin ${isRemoteRun ? "output-stdin-readonly" : ""}`}
              placeholder="Type program input here (one value per line)…"
              value={stdin}
              onChange={(e) => !isRemoteRun && setStdin(e.target.value)}
              readOnly={isRemoteRun}
              rows={3}
              spellCheck={false}
            />
          </div>

          {isRunning && (
            <div className="output-loading">
              <span className="run-spinner" /> Executing…
            </div>
          )}

          {!isRunning && !output && !error && (
            <span className="output-placeholder">
              Click ▶ Run to execute code. Output will appear here.
            </span>
          )}

          {error && (
            <div className="output-line output-stderr">⚠ {error}</div>
          )}

          {output && (
            <>
              {output.compile_output && (
                <div className="output-section">
                  <div className="output-section-label output-label-yellow">Compile Output</div>
                  <pre className="output-line output-compile">{output.compile_output}</pre>
                </div>
              )}
              {output.stderr && (
                <div className="output-section">
                  <div className="output-section-label output-label-red">Stderr</div>
                  <pre className="output-line output-stderr">{output.stderr}</pre>
                </div>
              )}
              {output.stdout && (
                <div className="output-section">
                  <div className="output-section-label output-label-green">Stdout</div>
                  <pre className="output-line output-stdout">{output.stdout}</pre>
                </div>
              )}
              {!output.stdout && !output.stderr && !output.compile_output && (
                <div className="output-line output-stdout">(no output)</div>
              )}
              <div className="output-meta">
                {output.time && <span>⏱ {output.time}s</span>}
                {output.memory && <span>💾 {output.memory} KB</span>}
                <span className={output.status === "Accepted" ? "output-ok-badge" : "output-error-badge"}>
                  {output.status}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}