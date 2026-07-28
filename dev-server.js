const { spawn, execSync } = require("child_process");
const path = require("path");
const os = require("os");

const isWin = os.platform() === "win32";

// Kill any process already holding port 8765 so restarts are clean
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
      pids.forEach((pid) => {
        try { execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" }); } catch {}
      });
    } else {
      execSync("fuser -k 8765/tcp", { stdio: "ignore" });
    }
  } catch {}
}

freePort8765();

// Start Python TTS server
const python = isWin ? "python" : "python3";
const ttsServer = spawn(python, ["server.py"], {
  cwd: path.join(__dirname, "tts-server"),
  stdio: ["ignore", "pipe", "pipe"],
});

ttsServer.stdout.on("data", (d) => {
  const msg = d.toString().trim();
  if (msg) console.log(`[tts] ${msg}`);
});
ttsServer.stderr.on("data", (d) => {
  const msg = d.toString().trim();
  if (msg) console.log(`[tts] ${msg}`);
});

// Start Next.js dev server
const next = spawn(isWin ? "npx.cmd" : "npx", ["next", "dev"], {
  cwd: __dirname,
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

next.stdout.on("data", (d) => {
  const msg = d.toString().trim();
  if (msg) console.log(`[next] ${msg}`);
});
next.stderr.on("data", (d) => {
  const msg = d.toString().trim();
  if (msg) console.log(`[next] ${msg}`);
});

// Cleanup on exit (kill child trees so nothing is left holding ports)
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

console.log("Starting TTS server (port 8765) + Next.js (port 3000)...");
