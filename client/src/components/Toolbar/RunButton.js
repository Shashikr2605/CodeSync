// Component: Run button + language selector (View layer)
const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python",     label: "Python"     },
  { value: "java",       label: "Java"       },
  { value: "cpp",        label: "C++"        },
  { value: "c",          label: "C"          },
];

export default function RunButton({ language, onRun, isRunning, disabled }) {
  // Only show run-supported languages
  const isSupported = SUPPORTED_LANGUAGES.some((l) => l.value === language);

  return (
    <button
      id="run-code-btn"
      className={`btn-run ${isRunning ? "btn-run-loading" : ""}`}
      onClick={onRun}
      disabled={disabled || isRunning || !isSupported}
      title={!isSupported ? `Run not supported for ${language}` : "Run code (Ctrl+Enter)"}
    >
      {isRunning ? (
        <>
          <span className="run-spinner" />
          Running…
        </>
      ) : (
        <>▶ Run</>
      )}
    </button>
  );
}
