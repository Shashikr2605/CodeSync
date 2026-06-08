require("dotenv").config();
const axios = require("axios");

// ── Provider 1: Wandbox (free, stable, handles all 5 languages without whitelist) ──
const WANDBOX_URL = "https://wandbox.org/api/compile.json";
const WANDBOX_LANGS = {
  javascript: "nodejs-20.17.0",
  python:     "cpython-3.12.7",
  java:       "openjdk-jdk-22+36",
  cpp:        "gcc-13.2.0",
  c:          "gcc-13.2.0-c",
};

// ── Provider 2: Piston (version:"*" = always picks latest available) ────────
const PISTON_URL   = "https://emkc.org/api/v2/piston/execute";
const PISTON_LANGS = {
  javascript: { language: "node",   version: "*" },
  python:     { language: "python", version: "*" },
  java:       { language: "java",   version: "*" },
  cpp:        { language: "c++",    version: "*" },
  c:          { language: "c",      version: "*" },
};

// ── Provider 3: Codex (free, no auth, fallback) ──────────────────────────────
// https://github.com/Jaagrav/CodeX
const CODEX_URL   = "https://api.codex.jaagrav.in";
const CODEX_LANGS = {
  javascript: "js",
  python:     "py",
  java:       "java",
  cpp:        "cpp",
  c:          "c",
};

const rateLimits          = new Map();
const MAX_RUNS_PER_MINUTE = 10;

function checkRateLimit(roomId) {
  const now = Date.now();
  if (!rateLimits.has(roomId)) {
    rateLimits.set(roomId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  const limit = rateLimits.get(roomId);
  if (now > limit.resetAt) {
    rateLimits.set(roomId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (limit.count >= MAX_RUNS_PER_MINUTE) return false;
  limit.count++;
  return true;
}

// ── Wandbox execution ────────────────────────────────────────────────────────
async function runViaWandbox(sourceCode, language) {
  const compiler = WANDBOX_LANGS[language];
  const res = await axios.post(
    WANDBOX_URL,
    {
      compiler,
      code: sourceCode,
      save: false,
    },
    { headers: { "Content-Type": "application/json" }, timeout: 25_000 }
  );

  const data = res.data || {};
  let status = "Accepted";
  if (data.status !== "0") {
    if (data.compiler_message || data.compiler_error) {
      status = "Compilation Error";
    } else {
      status = "Runtime Error";
    }
  }

  return {
    stdout:         data.program_output                   || "",
    stderr:         data.program_error                    || "",
    compile_output: data.compiler_message || data.compiler_error || "",
    status,
  };
}

// ── Piston execution ─────────────────────────────────────────────────────────
async function runViaPiston(sourceCode, language, stdin = stdin) {
  const lang = PISTON_LANGS[language];
  const res  = await axios.post(
    PISTON_URL,
    {
      language: lang.language,
      version:  lang.version,
      files:    [{ name: "main", content: sourceCode }],
      stdin:    "",
    },
    { headers: { "Content-Type": "application/json" }, timeout: 20_000 }
  );

  const run      = res.data.run     || {};
  const compile  = res.data.compile || {};
  const exitCode = run.code ?? 0;

  let status = "Accepted";
  if (compile.code !== undefined && compile.code !== 0) status = "Compilation Error";
  else if (exitCode !== 0) status = "Runtime Error";

  return {
    stdout:         run.stdout                     || "",
    stderr:         run.stderr                     || "",
    compile_output: compile.stderr || compile.stdout || "",
    status,
  };
}

// ── Codex fallback ───────────────────────────────────────────────────────────
async function runViaCodex(sourceCode, language, stdin = "") {
  const lang = CODEX_LANGS[language];

  // Codex expects application/x-www-form-urlencoded
  const body = new URLSearchParams();
  body.append("code",     sourceCode);
  body.append("language", lang);
  body.append("input", "stdin");

  const res = await axios.post(CODEX_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 30_000,
  });

  const { output = "", error = "" } = res.data;
  return {
    stdout:         output,
    stderr:         error,
    compile_output: "",
    status:         error ? "Runtime Error" : "Accepted",
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
async function handleRunCode(socket, { code, language, roomId, stdin = ""}) {
  if (!WANDBOX_LANGS[language]) {
    return socket.emit("code:error", { message: `Unsupported language: ${language}` });
  }

  if (!checkRateLimit(roomId)) {
    return socket.emit("code:error", {
      message: "Rate limit reached: max 10 runs/minute per room. Please wait.",
    });
  }

  try {
    let result;

    try {
      result = await runViaPiston(code, language, stdin);
      console.log("[CodeRunner] Piston succeeded");
    } catch (pistonErr) {
      console.warn(`[CodeRunner] Piston failed (${pistonErr.message}), trying Wandbox…`);
      try {
        result = await runViaWandbox(code, language, stdin);
        console.log("[CodeRunner] Wandbox succeeded");
      } catch (wandboxErr) {
        console.warn(`[CodeRunner] Wandbox failed (${wandboxErr.message}), trying Codex…`);
        result = await runViaCodex(code, language, stdin);
        console.log("[CodeRunner] Codex succeeded");
      }
    }

    socket.emit("code:output", { ...result, time: null, memory: null });
  } catch (err) {
    console.error("[CodeRunner] All providers failed:", err.message);
    socket.emit("code:error", { message: `Code execution failed: ${err.message}` });
  }
}

module.exports = { handleRunCode };
