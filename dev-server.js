const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWin = os.platform() === "win32";

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

// Cleanup on exit
process.on("SIGINT", () => {
  ttsServer.kill();
  next.kill();
  process.exit();
});
process.on("SIGTERM", () => {
  ttsServer.kill();
  next.kill();
  process.exit();
});

console.log("Starting TTS server (port 8765) + Next.js (port 3000)...");
