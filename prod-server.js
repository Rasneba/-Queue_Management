const { spawn, execSync, execFileSync } = require("child_process");
const path = require("path");
const os = require("os");

const isWin = os.platform() === "win32";

// Kill anything holding port 8765 (TTS) so the restart is clean
function freePort8765() {
  try {
    if (isWin) {
      const output = execSync('netstat -ano -p TCP | findstr ":8765"', { stdio: ["ignore", "pipe", "ignore"] }).toString();
      const pids = new Set();
      output.split("\n").forEach((line) => {
        const cols = line.trim().split(/\s+/);
        const pid = cols[cols.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      });
      pids.forEach((pid) => { try { execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" }); } catch {} });
    } else {
      execSync("fuser -k 8765/tcp", { stdio: "ignore" });
    }
  } catch {}
}

// Kill anything holding port 3000 (Next) so the restart is clean
function freePort3000() {
  try {
    if (isWin) {
      const output = execSync('netstat -ano -p TCP | findstr ":3000"', { stdio: ["ignore", "pipe", "ignore"] }).toString();
      const pids = new Set();
      output.split("\n").forEach((line) => {
        const cols = line.trim().split(/\s+/);
        const pid = cols[cols.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      });
      pids.forEach((pid) => { try { execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" }); } catch {} });
    } else {
      execSync("fuser -k 3000/tcp", { stdio: "ignore" });
    }
  } catch {}
}

freePort8765();
freePort3000();

// Build first (production optimized bundle) — skip if already built
const fs = require("fs");
if (!fs.existsSync(path.join(__dirname, ".next", "build-manifest.json"))) {
  console.log("Building Next.js production bundle...");
  try {
    execFileSync(isWin ? "npx.cmd" : "npx", ["next", "build"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: isWin,
    });
  } catch (e) {
    console.error("Build failed, aborting.", e.message);
    process.exit(1);
  }
} else {
  console.log("Build already exists, skipping...");
}

// Start Python TTS server
const python = isWin ? "python" : "python3";
const ttsServer = spawn(python, ["server.py"], {
  cwd: path.join(__dirname, "tts-server"),
  stdio: ["ignore", "pipe", "pipe"],
});
ttsServer.stdout.on("data", (d) => { const m = d.toString().trim(); if (m) console.log(`[tts] ${m}`); });
ttsServer.stderr.on("data", (d) => { const m = d.toString().trim(); if (m) console.log(`[tts] ${m}`); });

// Start Next.js in production mode
const next = spawn(isWin ? "npx.cmd" : "npx", ["next", "start"], {
  cwd: __dirname,
  stdio: ["ignore", "pipe", "pipe"],
  shell: isWin,
});
next.stdout.on("data", (d) => { const m = d.toString().trim(); if (m) console.log(`[next] ${m}`); });
next.stderr.on("data", (d) => { const m = d.toString().trim(); if (m) console.log(`[next] ${m}`); });

function shutdown() {
  try { ttsServer.kill("SIGKILL"); } catch {}
  try { next.kill("SIGKILL"); } catch {}
  if (isWin) {
    try { execSync(`taskkill /PID ${ttsServer.pid} /F /T`, { stdio: "ignore" }); } catch {}
    try { execSync(`taskkill /PID ${next.pid} /F /T`, { stdio: "ignore" }); } catch {}
  }
  process.exit();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", shutdown);

console.log("Starting TTS server (port 8765) + Next.js production (port 3000)...");
