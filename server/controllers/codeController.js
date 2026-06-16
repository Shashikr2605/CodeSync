require("dotenv").config();
const axios = require("axios");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const IS_WIN = process.platform === "win32";

// ── Supported languages ───────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = ["javascript", "python", "java", "cpp", "c"];

// ── Local execution config ────────────────────────────────────────────────────
// Writes source to a temp file, compiles (if needed), then runs it.
const LOCAL_CFG = {
  javascript: {
    ext: "js",
    compile: null,
    run: (dir, file) => ({ cmd: "node", args: [file] }),
  },
  python: {
    ext: "py",
    compile: null,
    // conda/Windows uses "python"; Linux uses "python3"
    run: (dir, file) => ({ cmd: IS_WIN ? "python" : "python3", args: [file] }),
  },
  java: {
    ext: "java",
    // Detects public class name and names the file accordingly
    compile: (dir, className) => ({
      cmd: "javac",
      args: [path.join(dir, `${className}.java`)],
    }),
    run: (dir, className) => ({
      cmd: "java",
      args: ["-cp", dir, className],
    }),
  },
  cpp: {
    ext: "cpp",
    compile: (dir) => ({
      cmd: "g++",
      args: [
        path.join(dir, "main.cpp"),
        "-o",
        path.join(dir, IS_WIN ? "out.exe" : "out"),
      ],
    }),
    run: (dir) => ({
      cmd: path.join(dir, IS_WIN ? "out.exe" : "out"),
      args: [],
    }),
  },
  c: {
    ext: "c",
    compile: (dir) => ({
      cmd: "gcc",
      args: [
        path.join(dir, "main.c"),
        "-o",
        path.join(dir, IS_WIN ? "out.exe" : "out"),
      ],
    }),
    run: (dir) => ({
      cmd: path.join(dir, IS_WIN ? "out.exe" : "out"),
      args: [],
    }),
  },
};

// ── Judge0 (self-hosted Docker fallback) ──────────────────────────────────────
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const JUDGE0_LANG_IDS = { javascript: 93, python: 71, java: 62, cpp: 54, c: 50 };

// ── Wandbox (cloud fallback) ──────────────────────────────────────────────────
const WANDBOX_URL = "https://wandbox.org/api/compile.json";
const WANDBOX_LANGS = {
  javascript: "nodejs-20.17.0",
  python: "cpython-3.12.7",
  java: "openjdk-jdk-22+36",
  cpp: "gcc-13.2.0",
  c: "gcc-13.2.0-c",
};

// ── Codex (last resort) ───────────────────────────────────────────────────────
const CODEX_URL = "https://api.codex.jaagrav.in";
const CODEX_LANGS = { javascript: "js", python: "py", java: "java", cpp: "cpp", c: "c" };

// ── Infrastructure error patterns ─────────────────────────────────────────────
const INFRA_PATTERNS = [
  "OCI runtime error", "crun: clone", "Resource temporarily unavailable",
  "container_linux", "operation not permitted",
];
const isInfraError = (t = "") =>
  INFRA_PATTERNS.some((p) => t.toLowerCase().includes(p.toLowerCase()));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimits = new Map();
const MAX_RUNS_PER_MINUTE = 10;

function checkRateLimit(roomId) {
  const now = Date.now();
  if (!rateLimits.has(roomId)) {
    rateLimits.set(roomId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  const lim = rateLimits.get(roomId);
  if (now > lim.resetAt) { rateLimits.set(roomId, { count: 1, resetAt: now + 60_000 }); return true; }
  if (lim.count >= MAX_RUNS_PER_MINUTE) return false;
  lim.count++;
  return true;
}

// ── Helper: spawn a process, pipe stdin, collect stdout/stderr ────────────────
function execProcess(cmd, args, stdin = "", timeoutMs = 12_000) {
  return new Promise((resolve, reject) => {
    let proc;
    try {
      proc = spawn(cmd, args, { timeout: timeoutMs });
    } catch (e) {
      return reject(e);
    }

    let stdout = "", stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    if (stdin) { proc.stdin.write(stdin); }
    proc.stdin.end();

    proc.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
    proc.on("error", reject);
  });
}

// ── Provider 1: Local execution via child_process ─────────────────────────────
async function runViaLocal(sourceCode, language, stdin = "") {
  const cfg = LOCAL_CFG[language];
  if (!cfg) throw new Error(`No local config for ${language}`);

  const id = crypto.randomBytes(6).toString("hex");
  const tmpDir = path.join(os.tmpdir(), `codesync-${id}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    let compile_output = "";

    if (language === "java") {
      // Detect public class name to correctly name the file
      const match = sourceCode.match(/public\s+class\s+(\w+)/);
      const className = match ? match[1] : "Main";
      const filePath = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(filePath, sourceCode, "utf8");

      const { cmd: cCmd, args: cArgs } = cfg.compile(tmpDir, className);
      const cr = await execProcess(cCmd, cArgs, "", 20_000);
      compile_output = cr.stdout + cr.stderr;

      if (cr.code !== 0) {
        return { stdout: "", stderr: compile_output, compile_output, status: "Compilation Error" };
      }

      const { cmd: rCmd, args: rArgs } = cfg.run(tmpDir, className);
      const rr = await execProcess(rCmd, rArgs, stdin, 10_000);
      return {
        stdout: rr.stdout,
        stderr: rr.stderr,
        compile_output,
        status: rr.code === 0 ? "Accepted" : "Runtime Error",
      };
    }

    if (language === "cpp" || language === "c") {
      const ext = language === "cpp" ? "cpp" : "c";
      const filePath = path.join(tmpDir, `main.${ext}`);
      fs.writeFileSync(filePath, sourceCode, "utf8");

      const { cmd: cCmd, args: cArgs } = cfg.compile(tmpDir);
      const cr = await execProcess(cCmd, cArgs, "", 20_000);
      compile_output = cr.stdout + cr.stderr;

      if (cr.code !== 0) {
        return { stdout: "", stderr: compile_output, compile_output, status: "Compilation Error" };
      }

      const { cmd: rCmd, args: rArgs } = cfg.run(tmpDir);
      const rr = await execProcess(rCmd, rArgs, stdin, 10_000);
      return {
        stdout: rr.stdout,
        stderr: rr.stderr,
        compile_output,
        status: rr.code === 0 ? "Accepted" : "Runtime Error",
      };
    }

    // Interpreted: Python, JavaScript
    const filePath = path.join(tmpDir, `main.${cfg.ext}`);
    fs.writeFileSync(filePath, sourceCode, "utf8");

    const { cmd, args } = cfg.run(tmpDir, filePath);
    const rr = await execProcess(cmd, args, stdin, 10_000);
    return {
      stdout: rr.stdout,
      stderr: rr.stderr,
      compile_output: "",
      status: rr.code === 0 ? "Accepted" : "Runtime Error",
    };

  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── Provider 2: Judge0 (self-hosted Docker) ───────────────────────────────────
async function runViaJudge0(sourceCode, language, stdin = "") {
  const language_id = JUDGE0_LANG_IDS[language];
  const submitRes = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    { source_code: sourceCode, language_id, stdin },
    { headers: { "Content-Type": "application/json" }, timeout: 8_000 }
  );
  const token = submitRes.data.token;
  if (!token) throw new Error("Judge0: no token returned");

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      { timeout: 5_000 }
    );
    const d = res.data;
    const statusId = d.status?.id;
    if (statusId <= 2) continue;

    const compile_output = d.compile_output || "";
    const stderr = d.stderr || "";

    if (isInfraError(compile_output) || isInfraError(stderr))
      throw new Error(`Judge0 infra error: ${compile_output || stderr}`);

    let status = "Accepted";
    if (statusId === 6)      status = "Compilation Error";
    else if (statusId !== 3) status = "Runtime Error";

    return { stdout: d.stdout || "", stderr, compile_output, status };
  }
  throw new Error("Judge0: timed out");
}

// ── Provider 3: Wandbox ───────────────────────────────────────────────────────
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

  if (isInfraError(compileMsg) || isInfraError(programErr))
    throw new Error(`Wandbox infra error: ${compileMsg || programErr}`);

  let status = "Accepted";
  if (data.status !== "0") {
    status = compileMsg ? "Compilation Error" : "Runtime Error";
  }

  return {
    stdout: data.program_output || "",
    stderr: programErr,
    compile_output: compileMsg,
    status,
  };
}

// ── Provider 4: Codex ─────────────────────────────────────────────────────────
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
    stdout: output,
    stderr: error,
    compile_output: "",
    status: error ? "Runtime Error" : "Accepted",
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
async function handleRunCode(io, socket, { code, language, roomId, stdin = "", username = "" }) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return socket.emit("code:error", { message: `Unsupported language: ${language}` });
  }

  if (!checkRateLimit(roomId)) {
    return socket.emit("code:error", {
      message: "Rate limit reached: max 10 runs/minute per room. Please wait.",
    });
  }

  io.to(roomId).emit("code:running", { username, stdin });

  const providers = [
    { name: "Local",   fn: () => runViaLocal(code, language, stdin)   },
    { name: "Judge0",  fn: () => runViaJudge0(code, language, stdin)  },
    { name: "Wandbox", fn: () => runViaWandbox(code, language, stdin) },
    { name: "Codex",   fn: () => runViaCodex(code, language, stdin)   },
  ];

  let lastErr;
  for (const { name, fn } of providers) {
    try {
      const result = await fn();
      console.log(`[CodeRunner] ${name} succeeded`);
      return io.to(roomId).emit("code:output", { ...result, time: null, memory: null });
    } catch (err) {
      lastErr = err;
      console.warn(`[CodeRunner] ${name} failed: ${err.message}`);
    }
  }

  console.error("[CodeRunner] All providers failed:", lastErr?.message);
  io.to(roomId).emit("code:error", { message: `Code execution failed: ${lastErr?.message}` });
}

module.exports = { handleRunCode };