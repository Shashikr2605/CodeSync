require("dotenv").config();
const axios = require("axios");

// ── Provider 1: Judge0 (primary — self-hosted via docker-compose) ─────────────
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
// Judge0 language IDs: https://github.com/judge0/judge0/blob/master/docs/api/judge0-api.yaml
const JUDGE0_LANG_IDS = {
  javascript: 93, // Node.js 18.15.0
  python:     71, // Python 3.8.1
  java:       62, // Java (OpenJDK 13.0.1)
  cpp:        54, // C++ (GCC 9.2.0)
  c:          50, // C (GCC 9.2.0)
};

// ── Provider 2: Wandbox (first fallback) ──────────────────────────────────────
const WANDBOX_URL = "https://wandbox.org/api/compile.json";
const WANDBOX_LANGS = {
  javascript: "nodejs-20.17.0",
  python:     "cpython-3.12.7",
  java:       "openjdk-jdk-22+36",
  cpp:        "gcc-13.2.0",
  c:          "gcc-13.2.0-c",
};

// ── Provider 3: Codex (last resort) ──────────────────────────────────────────
const CODEX_URL = "https://api.codex.jaagrav.in";
const CODEX_LANGS = {
  javascript: "js",
  python:     "py",
  java:       "java",
  cpp:        "cpp",
  c:          "c",
};

// ── Infrastructure error patterns that mean the provider itself failed ────────
const INFRA_ERROR_PATTERNS = [
  "OCI runtime error",
  "crun: clone",
  "Resource temporarily unavailable",
  "container_linux",
  "operation not permitted",
];

function isInfraError(text = "") {
  return INFRA_ERROR_PATTERNS.some((p) => text.toLowerCase().includes(p.toLowerCase()));
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimits = new Map();
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

// ── Judge0 execution ──────────────────────────────────────────────────────────
async function runViaJudge0(sourceCode, language, stdin = "") {
  const language_id = JUDGE0_LANG_IDS[language];

  // Submit
  const submitRes = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    { source_code: sourceCode, language_id, stdin },
    { headers: { "Content-Type": "application/json" }, timeout: 10_000 }
  );
  const token = submitRes.data.token;
  if (!token) throw new Error("Judge0: no token returned");

  // Poll for result (max 20s)
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      { timeout: 5_000 }
    );
    const d = res.data;
    const statusId = d.status?.id;

    // 1 = In Queue, 2 = Processing — keep polling
    if (statusId <= 2) continue;

    const compile_output = d.compile_output || "";
    const stderr         = d.stderr || "";

    // Detect infra errors and propagate as thrown errors so fallback kicks in
    if (isInfraError(compile_output) || isInfraError(stderr)) {
      throw new Error(`Judge0 infra error: ${compile_output || stderr}`);
    }

    let status = "Accepted";
    if (statusId === 6)       status = "Compilation Error";
    else if (statusId !== 3)  status = "Runtime Error";

    return {
      stdout:         d.stdout || "",
      stderr,
      compile_output,
      status,
    };
  }
  throw new Error("Judge0: execution timed out");
}

// ── Wandbox execution ─────────────────────────────────────────────────────────
async function runViaWandbox(sourceCode, language, stdin = "") {
  const compiler = WANDBOX_LANGS[language];
  const res = await axios.post(
    WANDBOX_URL,
    { compiler, code: sourceCode, stdin, save: false },
    { headers: { "Content-Type": "application/json" }, timeout: 25_000 }
  );

  const data = res.data || {};
  const compileMsg = data.compiler_message || data.compiler_error || "";
  const programErr = data.program_error || "";

  // If Wandbox returned an infrastructure error, throw so Codex fallback fires
  if (isInfraError(compileMsg) || isInfraError(programErr)) {
    throw new Error(`Wandbox infra error: ${compileMsg || programErr}`);
  }

  let status = "Accepted";
  if (data.status !== "0") {
    if (compileMsg) status = "Compilation Error";
    else            status = "Runtime Error";
  }

  return {
    stdout:         data.program_output || "",
    stderr:         programErr,
    compile_output: compileMsg,
    status,
  };
}

// ── Codex fallback ────────────────────────────────────────────────────────────
async function runViaCodex(sourceCode, language, stdin = "") {
  const lang = CODEX_LANGS[language];

  const body = new URLSearchParams();
  body.append("code", sourceCode);
  body.append("language", lang);
  body.append("input", stdin || "");

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

// ── Main handler ──────────────────────────────────────────────────────────────
async function handleRunCode(io, socket, { code, language, roomId, stdin = "", username = "" }) {
  if (!JUDGE0_LANG_IDS[language]) {
    return socket.emit("code:error", { message: `Unsupported language: ${language}` });
  }

  if (!checkRateLimit(roomId)) {
    return socket.emit("code:error", {
      message: "Rate limit reached: max 10 runs/minute per room. Please wait.",
    });
  }

  // Broadcast to ALL room members (including sender) that execution has started
  io.to(roomId).emit("code:running", { username, stdin });

  try {
    let result;

    // 1️⃣ Judge0 (self-hosted, fastest)
    try {
      result = await runViaJudge0(code, language, stdin);
      console.log("[CodeRunner] Judge0 succeeded");
    } catch (judge0Err) {
      console.warn(`[CodeRunner] Judge0 failed (${judge0Err.message}), trying Wandbox…`);

      // 2️⃣ Wandbox
      try {
        result = await runViaWandbox(code, language, stdin);
        console.log("[CodeRunner] Wandbox succeeded");
      } catch (wandboxErr) {
        console.warn(`[CodeRunner] Wandbox failed (${wandboxErr.message}), trying Codex…`);

        // 3️⃣ Codex (last resort)
        result = await runViaCodex(code, language, stdin);
        console.log("[CodeRunner] Codex succeeded");
      }
    }

    io.to(roomId).emit("code:output", { ...result, time: null, memory: null });
  } catch (err) {
    console.error("[CodeRunner] All providers failed:", err.message);
    io.to(roomId).emit("code:error", { message: `Code execution failed: ${err.message}` });
  }
}

module.exports = { handleRunCode };