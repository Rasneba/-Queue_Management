import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(distDir, "assets");
const frontendDir = fs.existsSync(path.join(rootDir, "frontend"))
  ? path.join(rootDir, "frontend")
  : rootDir;

// Clean output
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });

// index.html must sit at the dist root: Vercel rewrites "/" -> "/index.html".
const indexSource = ["index.html", path.join(frontendDir, "index.html")]
  .map((candidate) => (path.isAbsolute(candidate) ? candidate : path.join(rootDir, candidate)))
  .find((candidate) => fs.existsSync(candidate));
if (indexSource) {
  fs.copyFileSync(indexSource, path.join(distDir, "index.html"));
}

// Static files are served from /assets/*, matching index.html and the
// immutable Cache-Control rule in vercel.json.
function copyDir(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyDir(sourcePath, targetPath);
    } else if (entry.name !== "index.html") {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

copyDir(frontendDir, assetsDir);

// Any top-level asset folders (e.g. frontend/img) stay addressable by name.
for (const entry of fs.readdirSync(frontendDir, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name !== "assets") {
    const targetPath = path.join(distDir, entry.name);
    fs.mkdirSync(targetPath, { recursive: true });
    copyDir(path.join(frontendDir, entry.name), targetPath);
  }
}

// The static build has no bundler, so import.meta.env never exists at runtime.
// Emit a plain config script that app.js reads from window.__NEB_CONFIG__.
const apiBaseUrl = (process.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
fs.writeFileSync(
  path.join(assetsDir, "config.js"),
  `window.__NEB_CONFIG__ = ${JSON.stringify({ apiBaseUrl })};\n`,
  "utf-8",
);

console.log(`Neba frontend built: ${distDir}`);
console.log(apiBaseUrl ? `Speech API: ${apiBaseUrl}` : "Speech API: not configured (UI preview mode)");
