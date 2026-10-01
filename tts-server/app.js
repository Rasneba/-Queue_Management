import "./styles.css";

const ICONS = {
  spark: '<path d="m12 3-1.7 5.3L5 10l5.3 1.7L12 17l1.7-5.3L19 10l-5.3-1.7L12 3Z"/><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z"/>',
  arrow: '<path d="M5 12h13"/><path d="m13 6 6 6-6 6"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M5 14h1a2 2 0 0 1 2 2v3H6a3 3 0 0 1-3-3v-2h2ZM19 14h-1a2 2 0 0 0-2 2v3h2a3 3 0 0 0 3-3v-2h-2Z"/>',
  wave: '<path d="M3 12h2l2-7 4 14 3-10 2 3h5"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevron: '<path d="m7 9 5 5 5-5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
  studio: '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="m15 17 2-2 2 2"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4l2.7 1.7"/>',
  credit: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
  chart: '<path d="M4 19V5M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 7-7 3 3-7 7M17 7l2 2"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1-1.2.7v.1a2 2 0 0 1-4 0v-.1l-1.4-.7-.1.1a2 2 0 0 1-2.8-2.8l.1-.1-.7-1.4H6.4a2 2 0 0 1 0-4h.1l.7-1.4-.1-.1a2 2 0 0 1 2.8-2.8l.1.1 1.4-.7v-.1a2 2 0 0 1 4 0v.1l1.2.7.1-.1a2 2 0 0 1 2.8 2.8l-.1.1.7 1.4h.1a2 2 0 0 1 0 4h-.1l-.7 1.4Z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  users: '<path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  wallet: '<path d="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13"/><path d="M16 13h5M16 13a2 2 0 1 0 0 4h5"/>',
  terminal: '<path d="m5 7 5 5-5 5M13 17h6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3 20 6v5c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  users2: '<path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  alert: '<path d="m10.3 4.3-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
};

const icon = (name, size = 18) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;
const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const app = document.getElementById("app");
const profile = { name: "Ephrem Tadesse", email: "ephrem@example.com", credits: 72450 };
// Local FastAPI runs on the same origin. On Vercel, set VITE_API_BASE_URL to
// the deployed speech API; the site remains usable as a product preview when
// that backend is intentionally not connected yet.
// This build has no bundler, so import.meta.env is always undefined at runtime.
// scripts/build.mjs writes dist/assets/config.js from the environment instead.
const runtimeConfig = (typeof window !== "undefined" && window.__NEB_CONFIG__) || {};
const configuredApiBase =
  runtimeConfig.apiBaseUrl ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "";
const isVercelHost = /(^|\.)vercel\.app$/.test(window.location.hostname) || /(^|\.)vercel\.sh$/.test(window.location.hostname);
const API_BASE = configuredApiBase.replace(/\/$/, "") || (isVercelHost ? null : "");
const apiUrl = (path) => API_BASE === null ? null : `${API_BASE}${path}`;
let lastAudio = { blob: null, url: "", name: "" };
let studioTimer;

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(`neba:${key}`)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(`neba:${key}`, JSON.stringify(value)); },
};

function currentPath() { return window.location.pathname.replace(/\/$/, "") || "/"; }
function navigate(path) { window.history.pushState({}, "", path); window.scrollTo({ top: 0, behavior: "instant" }); render(); }
function toast(message, type = "success") {
  const root = document.getElementById("toast-root");
  const node = document.createElement("div"); node.className = `toast ${type}`;
  node.innerHTML = `${icon(type === "error" ? "alert" : "check", 16)}<span>${esc(message)}</span>`;
  root.appendChild(node); setTimeout(() => node.remove(), 3400);
}
function initials(name = profile.name) { return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
function activePath(path, target) { return path === target || (target !== "/dashboard" && path.startsWith(target)); }

function publicNav(active = "/") {
  return `<header class="public-nav"><div class="container public-nav-inner">
    <a class="brand" href="/" data-route="/"><span class="brand-mark">N</span><span>Neba<small>AMHARIC SPEECH</small></span></a>
    <button class="mobile-menu" data-action="mobile-menu" aria-label="Open menu">${icon("menu")}</button>
    <nav class="nav-links">
      <a class="${active === "/features" ? "active" : ""}" href="/features" data-route="/features">Product</a>
      <a class="${active === "/docs" || active === "/api" ? "active" : ""}" href="/docs" data-route="/docs">Docs</a>
      <a class="${active === "/pricing" ? "active" : ""}" href="/pricing" data-route="/pricing">Pricing</a>
      <a class="${active === "/about" ? "active" : ""}" href="/about" data-route="/about">About</a>
    </nav>
    <div class="nav-actions"><a class="btn btn-secondary" href="/login" data-route="/login">Sign in</a><a class="btn btn-primary" href="/register" data-route="/register">Start building ${icon("arrow", 15)}</a></div>
  </div></header>`;
}
function footer() {
  return `<footer class="public-footer"><div class="container"><div class="footer-grid">
    <div><a class="brand" href="/" data-route="/"><span class="brand-mark">N</span><span>Neba<small>AMHARIC SPEECH</small></span></a><p class="footer-note">A clear, expressive voice for Amharic content, products, and everyday moments.</p></div>
    <div class="footer-col"><h4>Explore</h4><a href="/features" data-route="/features">Product</a><a href="/demo" data-route="/demo">Live demo</a><a href="/pricing" data-route="/pricing">Pricing</a></div>
    <div class="footer-col"><h4>Developers</h4><a href="/docs" data-route="/docs">Documentation</a><a href="/api" data-route="/api">API reference</a><a href="/dashboard/api-keys" data-route="/dashboard/api-keys">API keys</a></div>
    <div class="footer-col"><h4>Company</h4><a href="/about" data-route="/about">About Neba</a><a href="/contact" data-route="/contact">Contact</a><a href="/login" data-route="/login">Workspace</a></div>
  </div><div class="footer-bottom"><span>© 2026 Neba. Built for Amharic voices.</span><span>Built with care in Ethiopia · አማርኛ</span></div></div></footer>`;
}
function publicLayout(content, active = "") { return `${publicNav(active)}<main>${content}</main>${footer()}`; }

function pageHeader(kicker, title, copy, action = "") {
  return `<section class="page-header"><div class="container"><span class="eyebrow">${kicker}</span><h1 class="display">${title}</h1><p class="lead">${copy}</p>${action ? `<div class="hero-actions">${action}</div>` : ""}</div></section>`;
}

function homePage() {
  const bars = Array.from({ length: 31 }, () => "<i></i>").join("");
  return publicLayout(`<section class="home-hero"><div class="container hero-grid"><div class="hero-copy"><span class="eyebrow">Amharic speech, made clear</span><h1 class="display">Give every word a <em>voice.</em></h1><p class="lead">A focused text-to-speech workspace for natural Amharic audio — from the first sentence to your production API.</p><div class="hero-actions"><a class="btn btn-primary" href="/register" data-route="/register">Try Neba free ${icon("arrow", 15)}</a><a class="btn btn-secondary" href="/demo" data-route="/demo">Listen to the demo ${icon("play", 14)}</a></div><div class="hero-meta"><span><b>01</b> Amharic-first</span><span><b>02</b> MP3 &amp; WAV</span><span><b>03</b> Developer ready</span></div></div><div class="hero-demo"><div class="demo-window"><div class="window-bar"><div class="window-lights"><i></i><i></i><i></i></div><span class="window-label">Neba / TTS studio</span><span class="tag"><span class="tag-dot"></span>Ready</span></div><div class="demo-body"><div class="demo-heading"><div><h3>Hear your words</h3><p>Paste a sentence and make it speak.</p></div>${icon("spark", 19)}</div><textarea class="demo-textarea" id="home-demo-text" maxlength="1000">እንኳን ወደ ኔባ በደህና መጡ። አማርኛን በግልጽ እና በተፈጥሯዊ ድምፅ ያዳምጡ።</textarea><div class="demo-footer"><span class="char-count" id="home-demo-count">0 / 1,000 characters</span><button class="btn btn-primary" data-action="home-speak">${icon("play", 14)} Generate audio</button></div><div class="wave" id="home-wave">${bars}</div><audio id="home-player" style="display:none"></audio></div></div></div></div></section><div class="trust-strip"><div class="trust-item"><b>Am</b>Amharic-first voices</div><div class="trust-item"><b>3</b>audio formats</div><div class="trust-item"><b>10k</b>free characters</div><div class="trust-item"><b>API</b>built to ship</div></div><section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">A simpler starting point</span><h2 class="section-title">Everything you need to make speech feel human.</h2></div><p class="section-copy">Start in the browser, tune the sound, then take the same workflow into your product when you are ready.</p></div><div class="grid feature-grid"><article class="feature-card"><div class="feature-icon">${icon("studio")}</div><h3>Write, tune, listen</h3><p>A calm studio for Amharic text, with voice, speed, format, and normalization controls in one place.</p></article><article class="feature-card"><div class="feature-icon">${icon("spark")}</div><h3>Pronunciation that understands</h3><p>Numbers, dates, currency, acronyms, and mixed-language text are prepared before synthesis.</p></article><article class="feature-card"><div class="feature-icon">${icon("terminal")}</div><h3>Ready for your API</h3><p>Move from a first generated sentence to a secure, usage-aware developer API without changing the core workflow.</p></article></div></div></section><section class="section"><div class="container split-story"><div><span class="eyebrow">From text to voice</span><h2 class="section-title">A better path from idea to audio.</h2><p class="section-copy">Neba keeps the important parts visible: what will be spoken, how it will sound, and how much it uses.</p></div><div class="story-list"><div class="story-step"><span class="step-num">01</span><div><h4>Prepare</h4><p>Normalize text and turn hard-to-say values into speech-ready Amharic.</p></div></div><div class="story-step"><span class="step-num">02</span><div><h4>Shape</h4><p>Choose a voice, pace, and output format for the moment you are creating.</p></div></div><div class="story-step"><span class="step-num">03</span><div><h4>Ship</h4><p>Download an audio file now, or use the API when your product is ready to scale.</p></div></div></div></div></section><section class="section"><div class="container"><div class="section-head"><div><span class="eyebrow">For developers</span><h2 class="section-title">One request. One clear result.</h2></div><a class="btn btn-secondary" href="/docs" data-route="/docs">Read the docs ${icon("arrow", 14)}</a></div><div class="code-card"><div class="code-bar"><span>POST /api/v1/tts</span><span>application/json</span></div><pre><span class="key">const</span> response = <span class="key">await</span> fetch(<span class="string">"/api/v1/tts"</span>, {
  method: <span class="string">"POST"</span>,
  headers: { Authorization: <span class="string">"Bearer YOUR_API_KEY"</span> },
  body: JSON.stringify({
    <span class="key">text</span>: <span class="string">"እንኳን ወደ አማርኛ በደህና መጡ።"</span>,
    <span class="key">voice</span>: <span class="string">"am-female"</span>, <span class="key">format</span>: <span class="string">"mp3"</span>
  })
});</pre></div></div></section><section class="section"><div class="container"><div class="cta-band"><h2>Make your next sentence sound like it belongs.</h2><a class="btn btn-primary" href="/register" data-route="/register">Create your workspace ${icon("arrow", 15)}</a></div></div></section>`, "/");
}

function featuresPage() {
  const cards = [
    ["studio", "TTS Studio", "A focused canvas for writing Amharic text, previewing normalization, and generating a clean audio file."],
    ["spark", "Amharic-aware prep", "Numbers, dates, currency, acronyms, symbols, and mixed English text are prepared for a clearer read."],
    ["sliders", "Voice controls", "Shape the feeling with speed, pitch, volume, pause length, gender, and speaking style."],
    ["history", "Audio history", "Keep generated audio and its settings close by, so repeating a useful voice is easy."],
    ["credit", "Credits that make sense", "See your character balance and usage before you generate — no mysterious metering."],
    ["terminal", "A developer path", "Use the studio first, then create an API key and take the same text-to-speech flow into your app."],
  ];
  return publicLayout(pageHeader("The Neba workspace", "A small, thoughtful home for Amharic audio.", "Everything is designed around the act of making one clear sentence sound right.", `<a class="btn btn-primary" href="/demo" data-route="/demo">Try the studio ${icon("arrow", 15)}</a>`) + `<section class="page-content"><div class="container"><div class="content-grid">${cards.map(([ic, title, copy]) => `<article class="info-card"><div class="feature-icon">${icon(ic)}</div><h3>${title}</h3><p>${copy}</p></article>`).join("")}</div><div class="section" style="padding-bottom:0"><div class="split-story"><div><span class="eyebrow">Built for clarity</span><h2 class="section-title">Good defaults. Room to make it yours.</h2></div><div class="long-copy"><p>Neba starts with the practical details that change how speech sounds: a number should be spoken like a number, a date should not be read as a string of digits, and a sentence should have room to breathe.</p><ul class="list-check"><li>Amharic and English in the same sentence</li><li>MP3, WAV, and FLAC output options</li><li>Preview the spoken form before generation</li><li>Usage and API foundations for your next step</li></ul></div></div></div></div></section>`, "/features");
}

function demoPage() {
  return publicLayout(pageHeader("Live demo", "Hear it before you build it.", "Try the same focused studio that powers the Neba workspace. Your first few generations are free to explore.") + `<section class="page-content" style="padding-top:52px"><div class="container"><div class="studio-grid"><div class="panel studio-panel"><div class="panel-head"><div><h2>Amharic TTS Studio</h2><p>Write a sentence, then choose how it should feel.</p></div><span class="tag"><span class="tag-dot"></span>Free preview</span></div>${studioForm("demo")}</div><div class="panel audio-result"><div class="panel-head"><div><h2>Your audio</h2><p>Generated files stay in this browser session.</p></div>${icon("headphones", 1)}</div>${audioResult("demo")}</div></div><div class="notice">${icon("info")}<span><b>Demo limits:</b> up to 500 characters per generation. Sign up to keep a history and receive 10,000 free characters.</span></div></div></section>`, "/demo");
}

function pricingPage() {
  const plans = [
    ["Free", "0 ETB", "For trying the voice and small personal projects.", ["10,000 characters / month", "Studio access", "Community support"], false],
    ["Starter", "50 ETB", "For creators making consistent audio every month.", ["100,000 characters / month", "MP3, WAV, FLAC", "Usage history"], false],
    ["Developer", "200 ETB", "For products and teams building with Amharic speech.", ["500,000 characters / month", "Developer API", "API usage tracking"], true],
    ["Business", "600 ETB", "For higher-volume teams with a shared workspace.", ["2,000,000 characters / month", "Priority support", "Team-ready foundations"], false],
  ];
  return publicLayout(pageHeader("Simple pricing", "Pay for characters, not surprises.", "Start with a generous free workspace. Upgrade when your usage has somewhere to go.") + `<section class="page-content" style="padding-top:48px"><div class="container"><div class="pricing-grid">${plans.map(([name, price, desc, items, featured]) => `<article class="price-card ${featured ? "featured" : ""}"><div class="price-label"><span>${name}</span>${featured ? '<span class="price-badge">Most useful</span>' : ""}</div><h3>${price}</h3><p class="price-description">${desc}</p><ul class="price-features">${items.map((item) => `<li>${item}</li>`).join("")}</ul><a class="btn ${featured ? "btn-primary" : "btn-secondary"} btn-full" href="/register" data-route="/register">Choose ${name}</a></article>`).join("")}</div><div class="panel padded" style="margin-top:18px; display:flex; justify-content:space-between; align-items:center; gap:25px"><div><span class="eyebrow">Pay as you go</span><h3 style="margin:10px 0 5px;font-size:19px">Need a one-off batch?</h3><p class="muted" style="margin:0;font-size:12px">Purchase 100,000 characters that never expire. Payments will be connected in the next product phase.</p></div><span class="tag">Coming next · 500 ETB</span></div></div></section>`, "/pricing");
}

function docsPage(api = false) {
  const title = api ? "An API for the voice you trust." : "Documentation that gets out of the way.";
  return publicLayout(pageHeader(api ? "Developer API" : "Documentation", title, "Start in the studio, or send a text-to-speech request from your product when you are ready.", `<a class="btn btn-primary" href="/register" data-route="/register">Get an API key ${icon("arrow", 15)}</a>`) + `<section class="page-content"><div class="container"><div class="api-layout"><div class="long-copy"><h2>Quick start</h2><p>Every request accepts Amharic text and returns an audio URL with the character count and credits used. The frontend prototype already connects to the local speech engine at <code>/speak</code>; the production API contract is designed to grow from there.</p><div class="code-card" style="margin-top:26px"><div class="code-bar"><span>POST /api/v1/tts</span><span>JSON</span></div><pre>curl -X POST https://api.neba.et/api/v1/tts \\
  -H <span class="string">"Authorization: Bearer sk_live_..."</span> \\
  -H <span class="string">"Content-Type: application/json"</span> \\
  -d <span class="string">'{
    "text": "እንኳን ደህና መጡ።",
    "voice": "am-female",
    "format": "mp3",
    "speed": 1.0
  }'</span></pre></div><h2>Response</h2><div class="code-block">{<br>&nbsp; <span class="green">"success"</span>: true,<br>&nbsp; <span class="green">"audio_url"</span>: <span class="orange">"https://.../audio.mp3"</span>,<br>&nbsp; <span class="green">"characters"</span>: 24,<br>&nbsp; <span class="green">"credits_used"</span>: 24<br>}</div></div><div class="grid"><div class="panel padded"><div class="feature-icon">${icon("shield")}</div><h3 style="margin:0 0 9px">Built with guardrails</h3><p class="muted" style="margin:0;font-size:12px;line-height:1.7">Keys are shown once, requests are metered, and payment and usage events have a clear home in the platform.</p></div><div class="panel padded"><div class="feature-icon">${icon("book")}</div><h3 style="margin:0 0 9px">Guides coming soon</h3><p class="muted" style="margin:0;font-size:12px;line-height:1.7">Voice selection, webhooks, rate limits, and production examples will live here as the API layer is added.</p></div></div></div></div></section>`, api ? "/api" : "/docs");
}

function aboutPage() { return publicLayout(pageHeader("About Neba", "A voice for the language we live in.", "Neba is an Amharic-first speech platform taking shape one useful workflow at a time.") + `<section class="page-content"><div class="container"><div class="long-copy"><h2>Why Neba</h2><p>Most tools make Amharic an afterthought. Neba starts with it: the writing, the rhythm, the way dates and numbers show up in daily life, and the care it takes to make a sentence feel familiar.</p><h2>Small now. Ready for more.</h2><p>The first version is intentionally practical — a studio, a real speech engine, pronunciation preparation, and a developer-shaped path. Accounts, credits, payments, jobs, and team tools can grow around that core without making the first experience heavy.</p><ul class="list-check"><li>Focused on useful, natural Amharic output</li><li>Designed in the open, with clear product foundations</li><li>Ready to connect to the tools creators and developers already use</li></ul></div></div></section>`, "/about"); }
function contactPage() { return publicLayout(pageHeader("Contact", "Tell us what you are making.", "Whether you are testing a voice or planning a product, we would like to hear what a better Amharic speech workflow looks like for you.", `<a class="btn btn-primary" href="mailto:hello@neba.et">Email hello@neba.et ${icon("arrow", 15)}</a>`) + `<section class="page-content"><div class="container"><div class="content-grid"><div class="info-card"><div class="feature-icon">${icon("terminal")}</div><h3>Developer questions</h3><p>Ask about the API direction, voices, usage, or how to prepare a production integration.</p></div><div class="info-card"><div class="feature-icon">${icon("spark")}</div><h3>Voice feedback</h3><p>Tell us what sounds natural, what needs work, and which kinds of Amharic content matter most.</p></div><div class="info-card"><div class="feature-icon">${icon("users2")}</div><h3>Early teams</h3><p>Have a larger use case? Reach out and help shape the workspace around real needs.</p></div></div></div></section>`, "/contact"); }

function authPage(mode = "login") {
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const title = isRegister ? "Create your workspace" : isForgot ? "Reset your password" : "Welcome back";
  const description = isRegister ? "Start with 10,000 free characters and a clear place to make speech." : isForgot ? "Enter your email and we will show the next step for your account." : "Sign in to continue making Amharic speech.";
  return `<main class="auth-page"><aside class="auth-aside"><a class="brand" href="/" data-route="/"><span class="brand-mark">N</span><span>Neba<small>AMHARIC SPEECH</small></span></a><div class="auth-aside-content"><span class="eyebrow">Your voice workspace</span><h1>Make the language you know <em>heard.</em></h1><p>Write a sentence. Shape the sound. Keep the audio close. Neba gives Amharic a home built around the way you actually work.</p></div><p class="auth-quote">“አማርኛን በግልጽ ድምፅ እናድምጥ።”<br><span class="muted">Let’s hear Amharic clearly.</span></p></aside><section class="auth-form-side"><div class="auth-form"><a class="brand" href="/" data-route="/"><span class="brand-mark">N</span><span>Neba<small>AMHARIC SPEECH</small></span></a><h2>${title}</h2><p>${description}</p><form class="form-stack" id="auth-form" data-auth-mode="${mode}">${isRegister ? `<div class="field-row"><div><label class="field-label" for="auth-name">Full name</label><input class="field-input" id="auth-name" name="name" required placeholder="Ephrem Tadesse" /></div><div><label class="field-label" for="auth-phone">Phone <span class="muted">(optional)</span></label><input class="field-input" id="auth-phone" name="phone" placeholder="09..." /></div></div>` : ""}<div><label class="field-label" for="auth-email">Email address</label><input class="field-input" id="auth-email" name="email" type="email" required placeholder="you@example.com" /></div>${!isForgot ? `<div><label class="field-label" for="auth-password">Password</label><input class="field-input" id="auth-password" name="password" type="password" required minlength="6" placeholder="At least 6 characters" /></div>` : ""}${!isRegister && !isForgot ? `<div class="form-inline"><label class="check-label"><input type="checkbox" /> Remember me</label><a href="/forgot-password" data-route="/forgot-password">Forgot password?</a></div>` : ""}<button class="btn btn-primary btn-full" type="submit">${isRegister ? "Create workspace" : isForgot ? "Send reset link" : "Sign in"} ${icon("arrow", 15)}</button></form><div class="form-message" id="auth-message"></div><div class="auth-switch">${isForgot ? `Remembered it? <a href="/login" data-route="/login">Back to sign in</a>` : isRegister ? `Already have an account? <a href="/login" data-route="/login">Sign in</a>` : `New to Neba? <a href="/register" data-route="/register">Create a workspace</a>`}</div></div></section></main>`;
}

function sidebar(path, admin = false) {
  const nav = admin ? [
    ["/admin", "Overview", "home"], ["/admin/users", "Users", "users"], ["/admin/tts-jobs", "TTS jobs", "studio"], ["/admin/payments", "Payments", "credit"], ["/admin/usage", "API usage", "chart"], ["/admin/audit-logs", "Audit logs", "shield"],
  ] : [
    ["/dashboard", "Overview", "home"], ["/dashboard/tts", "TTS Studio", "studio"], ["/dashboard/history", "Audio history", "history"], ["/dashboard/credits", "Credits", "credit"], ["/dashboard/usage", "Usage", "chart"], ["/dashboard/api-keys", "API keys", "key"], ["/dashboard/billing", "Billing", "card"],
  ];
  return `<aside class="sidebar" id="sidebar"><a class="brand" href="${admin ? "/admin" : "/dashboard"}" data-route="${admin ? "/admin" : "/dashboard"}"><span class="brand-mark">N</span><span>Neba<small>${admin ? "ADMIN CONSOLE" : "AMHARIC SPEECH"}</small></span></a><div class="side-section-label">${admin ? "Management" : "Workspace"}</div><nav class="side-nav">${nav.map(([href, label, ic]) => `<a class="side-link ${activePath(path, href) ? "active" : ""}" href="${href}" data-route="${href}">${icon(ic, 16)}<span>${label}</span></a>`).join("")}</nav><div class="side-section-label">More</div><nav class="side-nav">${admin ? `<a class="side-link" href="/dashboard" data-route="/dashboard">${icon("external", 16)}<span>User workspace</span></a>` : `<a class="side-link ${activePath(path, "/dashboard/docs") ? "active" : ""}" href="/dashboard/docs" data-route="/dashboard/docs">${icon("book", 16)}<span>Documentation</span></a><a class="side-link ${activePath(path, "/dashboard/settings") ? "active" : ""}" href="/dashboard/settings" data-route="/dashboard/settings">${icon("settings", 16)}<span>Settings</span></a>`}</nav><div class="sidebar-bottom"><a class="side-link" href="/" data-route="/">${icon("globe", 16)}<span>Visit website</span></a><button class="side-link" style="width:100%;border:0;background:none;text-align:left" data-action="logout">${icon("logout", 16)}<span>Log out</span></button><div class="sidebar-profile"><span class="avatar ${admin ? "" : "lime"}">${admin ? "AD" : initials()}</span><span><strong>${admin ? "Neba admin" : profile.name}</strong><small>${admin ? "SUPER_ADMIN" : "Developer plan"}</small></span></div></div></aside>`;
}
function appTopbar(path, admin = false) {
  const current = path.split("/").filter(Boolean).pop() || (admin ? "admin" : "dashboard");
  const labels = { dashboard: "Overview", tts: "TTS Studio", history: "Audio history", credits: "Credits", usage: "Usage", "api-keys": "API keys", billing: "Billing", docs: "Documentation", settings: "Settings", admin: "Overview", users: "Users", "tts-jobs": "TTS jobs", payments: "Payments", "audit-logs": "Audit logs" };
  return `<header class="topbar"><div class="breadcrumbs"><button class="topbar-icon topbar-menu" data-action="sidebar-toggle" aria-label="Open navigation">${icon("menu", 18)}</button><span>${admin ? "Admin" : "Workspace"}</span><span>/</span><b>${labels[current] || "Overview"}</b></div><div class="topbar-actions"><span class="tag"><span class="tag-dot"></span>${admin ? "System healthy" : `${Number(store.get("credits", profile.credits)).toLocaleString()} credits`}</span><button class="topbar-icon" data-action="notifications" aria-label="Notifications">${icon("bell", 17)}</button><a class="btn btn-primary" href="${admin ? "/admin/users" : "/dashboard/tts"}" data-route="${admin ? "/admin/users" : "/dashboard/tts"}">${admin ? "Manage users" : "Generate speech"} ${icon("arrow", 14)}</a></div></header>`;
}
function appLayout(content, path, admin = false) { return `<div class="app-shell ${admin ? "admin-shell" : ""}">${sidebar(path, admin)}<div class="main">${appTopbar(path, admin)}<main class="main-inner">${content}</main></div></div>`; }

function dashboardOverview() {
  const credits = Number(store.get("credits", profile.credits));
  return `<div class="dashboard-title"><div><span class="eyebrow">Tuesday, September 30, 2026</span><h1>Good morning, Ephrem.</h1><p>Your workspace is ready when you are.</p></div><div class="dashboard-title-actions"><a class="btn btn-secondary" href="/dashboard/history" data-route="/dashboard/history">View history</a><a class="btn btn-primary" href="/dashboard/tts" data-route="/dashboard/tts">${icon("spark", 14)} New generation</a></div></div><div class="stats-grid"><div class="stat-card"><div class="stat-top"><span>Available characters</span><span class="stat-icon">${icon("credit", 15)}</span></div><div class="stat-value">${credits.toLocaleString()}</div><div class="stat-foot"><span class="change">+10,000</span> free credits included</div></div><div class="stat-card"><div class="stat-top"><span>Characters used</span><span class="stat-icon">${icon("chart", 15)}</span></div><div class="stat-value">27,550</div><div class="stat-foot"><span class="change">12.8%</span> less than last month</div></div><div class="stat-card"><div class="stat-top"><span>Audio generated</span><span class="stat-icon">${icon("studio", 15)}</span></div><div class="stat-value">184</div><div class="stat-foot"><span class="change">+24</span> this month</div></div><div class="stat-card"><div class="stat-top"><span>API requests</span><span class="stat-icon">${icon("terminal", 15)}</span></div><div class="stat-value">213</div><div class="stat-foot"><span class="change">99.8%</span> success rate</div></div></div><div class="dashboard-grid"><section class="panel balance-card"><div class="panel-head"><div><h2>Character balance</h2><p>Developer plan · renews Oct 30, 2026</p></div><span class="tag">500k / month</span></div><div class="balance-numbers"><strong>${credits.toLocaleString()}</strong><span>characters available</span></div><div class="progress"><span style="width:${Math.max(8, Math.min(100, credits / 5000))}%"></span></div><div class="progress-label"><span>27,550 used this month</span><span>500,000 monthly</span></div><div class="balance-bottom"><div><small>Estimated generations left</small><b>1,340 short scripts</b></div><a class="btn btn-secondary" href="/dashboard/credits" data-route="/dashboard/credits">Manage credits ${icon("arrow", 14)}</a></div></section><section class="panel padded"><div class="panel-head"><div><h2>Recent activity</h2><p>Your latest speech work</p></div><a class="link-small" href="/dashboard/history" data-route="/dashboard/history">See all</a></div><div class="activity-list"><div class="activity-row"><span class="activity-bullet">${icon("play", 13)}</span><div><strong>የዛሬ ዋጋ ምንድነው።</strong><small>Female · MP3 · 81 characters</small></div><time>2m</time></div><div class="activity-row"><span class="activity-bullet">${icon("download", 13)}</span><div><strong>እንኳን ደህና መጡ።</strong><small>Female · WAV · 32 characters</small></div><time>1h</time></div><div class="activity-row"><span class="activity-bullet">${icon("play", 13)}</span><div><strong>ማስታወቂያ ለዛሬ</strong><small>Female · MP3 · 450 characters</small></div><time>Yesterday</time></div></div></section></div><div class="dashboard-grid"><section class="panel chart-panel"><div class="panel-head"><div><h2>Character usage</h2><p>Daily usage · September 2026</p></div><select class="field-select" style="width:100px;min-height:32px"><option>30 days</option><option>7 days</option></select></div><div class="usage-chart">${[31, 48, 38, 62, 52, 74, 57, 81, 66, 91, 76, 62, 84, 71].map((height, i) => `<div class="bar-col"><div class="bar ${i === 13 ? "today" : ""}" style="height:${height}%"></div><label>${["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "T"][i]}</label></div>`).join("")}</div></section><section class="panel quick-card"><div class="panel-head"><div><h2>Quick actions</h2><p>Shortcuts for your workflow</p></div></div><div class="quick-actions"><a class="quick-action" href="/dashboard/tts" data-route="/dashboard/tts">${icon("studio", 16)}<span>Open TTS Studio ${icon("arrow", 13)}</span></a><a class="quick-action" href="/dashboard/api-keys" data-route="/dashboard/api-keys">${icon("key", 16)}<span>Create API key ${icon("arrow", 13)}</span></a><a class="quick-action" href="/dashboard/credits" data-route="/dashboard/credits">${icon("credit", 16)}<span>Buy credits ${icon("arrow", 13)}</span></a><a class="quick-action" href="/dashboard/docs" data-route="/dashboard/docs">${icon("book", 16)}<span>Read docs ${icon("arrow", 13)}</span></a></div></section></div>`;
}

function studioForm(id = "studio") {
  return `<textarea class="studio-textarea" id="${id}-text" maxlength="5000" placeholder="አማርኛ ጽሑፍዎን እዚህ ይጻፉ...">እንኳን ወደ ኔባ በደህና መጡ። አማርኛን በግልጽ እና በተፈጥሯዊ ድምፅ ያዳምጡ።</textarea><div class="studio-meta"><span id="${id}-count">0 / 5,000 characters</span><span>1 character = 1 credit</span></div><div class="studio-controls"><div class="control-group"><label for="${id}-voice">Voice</label><select class="field-select" id="${id}-voice"><option value="female">Amharic · Female</option><option value="male">Amharic · Male</option></select></div><div class="control-group"><label for="${id}-speed">Speed</label><select class="field-select" id="${id}-speed"><option value="-10%">0.9× · Calm</option><option value="+0%">1.0× · Natural</option><option value="+10%">1.1× · Quick</option><option value="+20%">1.2× · Fast</option></select></div><div class="control-group"><label for="${id}-format">Format</label><select class="field-select" id="${id}-format"><option value="mp3">MP3 · Compact</option><option value="wav">WAV · Full quality</option><option value="flac">FLAC · Lossless</option></select></div></div><div class="studio-actions"><button class="btn btn-secondary" data-action="normalize" data-studio="${id}">${icon("spark", 14)} Preview pronunciation</button><button class="btn btn-primary" data-action="generate" data-studio="${id}">${icon("play", 14)} Generate speech</button></div><div class="normalization" id="${id}-normalization" style="display:none"><div class="panel-head" style="margin-bottom:0"><div><h2>Speech preview</h2><p>This is the text the engine will hear.</p></div></div><div class="normalization-text" id="${id}-normalized-text"></div><div class="normalization-notes" id="${id}-normalized-notes"></div></div>`;
}
function audioResult(id) {
  return `<div class="audio-empty" id="${id}-audio-empty"><div><div class="feature-icon">${icon("wave", 21)}</div><h3>No audio yet</h3><p>Your generated audio will appear here with a player and download link.</p></div></div><div class="audio-ready" id="${id}-audio-ready"><span class="tag"><span class="tag-dot"></span>Generated just now</span><div class="wave playing" style="margin-top:20px">${Array.from({ length: 28 }, () => "<i></i>").join("")}</div><audio id="${id}-player" controls></audio><div class="audio-details"><span>File <strong id="${id}-filename">tts.mp3</strong></span><span><strong id="${id}-size">—</strong></span></div><a class="btn btn-primary btn-full" id="${id}-download" href="#" download>${icon("download", 14)} Download audio</a></div>`;
}

async function requestAudio(id) {
  const text = document.getElementById(`${id}-text`)?.value.trim();
  if (!text) { toast("Write some Amharic text first.", "error"); return; }
  const voice = document.getElementById(`${id}-voice`)?.value || "female";
  const rate = document.getElementById(`${id}-speed`)?.value || "-10%";
  const format = document.getElementById(`${id}-format`)?.value || "mp3";
  const button = document.querySelector(`[data-action="generate"][data-studio="${id}"]`);
  const original = button?.innerHTML;
  if (button) { button.disabled = true; button.innerHTML = `${icon("clock", 14)} Generating...`; }
  try {
    if (API_BASE === null) throw new Error("Speech API is not connected. Add VITE_API_BASE_URL in Vercel project settings.");
    const response = await fetch(apiUrl("/speak"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang: "am", gender: voice, age: "adult", style: "professional", rate, pitch: "+0Hz", volume: "+0%", pause: 1, adaptive: true, normalize: true, format }) });
    if (!response.ok || !(response.headers.get("content-type") || "").startsWith("audio/")) { let detail = response.statusText; try { detail = (await response.json()).detail || detail; } catch {} throw new Error(detail || "The speech API is unavailable"); }
    const blob = await response.blob();
    const name = `neba-${new Date().toISOString().slice(0, 10)}.${format}`;
    showAudio(id, blob, name);
    const balance = Math.max(0, Number(store.get("credits", profile.credits)) - text.length);
    store.set("credits", balance);
    toast(`${text.length.toLocaleString()} credits used. Your audio is ready.`);
  } catch (error) {
    toast(`Could not generate audio: ${error.message || "Try again."}`, "error");
  } finally { if (button) { button.disabled = false; button.innerHTML = original; } }
}
function showAudio(id, blob, name) {
  const url = URL.createObjectURL(blob); lastAudio = { blob, url, name };
  const empty = document.getElementById(`${id}-audio-empty`), ready = document.getElementById(`${id}-audio-ready`), player = document.getElementById(`${id}-player`), download = document.getElementById(`${id}-download`);
  if (empty) empty.style.display = "none"; if (ready) ready.classList.add("show"); if (player) player.src = url;
  if (download) { download.href = url; download.download = name; }
  const filename = document.getElementById(`${id}-filename`), size = document.getElementById(`${id}-size`);
  if (filename) filename.textContent = name; if (size) size.textContent = `${Math.max(1, Math.round(blob.size / 1024))} KB`;
}
async function normalizeText(id) {
  const text = document.getElementById(`${id}-text`)?.value.trim(); if (!text) { toast("Write some text to preview.", "error"); return; }
  const button = document.querySelector(`[data-action="normalize"][data-studio="${id}"]`); const original = button?.innerHTML;
  if (button) { button.disabled = true; button.innerHTML = `${icon("clock", 14)} Preparing...`; }
  try {
    if (API_BASE === null) throw new Error("Speech API is not connected");
    const response = await fetch(apiUrl("/normalize"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang: "am", age: "adult", style: "professional", rate: document.getElementById(`${id}-speed`)?.value || "-10%", pitch: "+0Hz", pause: 1 }) });
    if (!response.ok) throw new Error("Normalization is unavailable");
    const data = await response.json();
    document.getElementById(`${id}-normalized-text`).textContent = data.text || text;
    document.getElementById(`${id}-normalized-notes`).innerHTML = (data.notes || []).map((note) => `• ${esc(note)}`).join("<br>") || "No changes needed — this text is ready to speak.";
  } catch { document.getElementById(`${id}-normalized-text`).textContent = text; document.getElementById(`${id}-normalized-notes`).textContent = "Preview shown locally. The speech engine will normalize before generation."; }
  const box = document.getElementById(`${id}-normalization`); if (box) box.style.display = "block";
  if (button) { button.disabled = false; button.innerHTML = original; }
}
function attachStudio(id) {
  const text = document.getElementById(`${id}-text`); const count = document.getElementById(`${id}-count`);
  const update = () => { if (count && text) count.textContent = `${text.value.length.toLocaleString()} / 5,000 characters`; };
  text?.addEventListener("input", update); update();
}

function studioPage() { return `<div class="dashboard-title"><div><span class="eyebrow">Create audio</span><h1>TTS Studio</h1><p>Turn your words into a clear Amharic voice.</p></div><span class="tag"><span class="tag-dot"></span>1 credit per character</span></div><div class="studio-grid"><section class="panel studio-panel">${studioForm("studio")}</section><section class="panel audio-result"><div class="panel-head"><div><h2>Generated audio</h2><p>Preview, then download your file.</p></div>${icon("spark", 17)}</div>${audioResult("studio")}</section></div>`; }
function historyPage() { return `<div class="dashboard-title"><div><span class="eyebrow">Your audio</span><h1>History</h1><p>Every useful sentence, in one place.</p></div><a class="btn btn-primary" href="/dashboard/tts" data-route="/dashboard/tts">${icon("plus", 14)} New generation</a></div><section class="panel table-panel"><div class="panel-head" style="padding:22px 20px 0;margin-bottom:6px"><div><h2>September 2026</h2><p>184 audio generations</p></div><select class="field-select" style="width:105px;min-height:34px"><option>All formats</option><option>MP3</option><option>WAV</option></select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Date</th><th>Text</th><th>Characters</th><th>Voice</th><th>Format</th><th>Status</th><th></th></tr></thead><tbody>${[["Sep 30, 10:42", "የዛሬ ዋጋ ምንድነው።", "81", "Female", "MP3"], ["Sep 30, 09:18", "እንኳን ደህና መጡ።", "32", "Female", "WAV"], ["Sep 29, 16:04", "ማስታወቂያ ለዛሬ", "450", "Female", "MP3"], ["Sep 28, 12:35", "ትኬት ቁጥር 42", "24", "Male", "MP3"], ["Sep 27, 08:51", "የምርት ማብራሪያ", "1,240", "Female", "FLAC"]].map(([date, text, chars, voice, format]) => `<tr><td>${date}</td><td><strong>${text}</strong></td><td>${chars}</td><td>${voice}</td><td>${format}</td><td><span class="table-status">Ready</span></td><td><button class="btn btn-ghost" data-action="history-play">${icon("play", 13)}</button></td></tr>`).join("")}</tbody></table></div></section>`; }
function creditsPage() { const credits = Number(store.get("credits", profile.credits)); return `<div class="dashboard-title"><div><span class="eyebrow">Usage wallet</span><h1>Credits</h1><p>Keep your balance visible and your audio work moving.</p></div><a class="btn btn-primary" href="/pricing" data-route="/pricing">Buy more credits ${icon("arrow", 14)}</a></div><div class="dashboard-grid"><section class="panel balance-card"><div class="panel-head"><div><h2>Available balance</h2><p>Credits can be used in the studio or through the API.</p></div></div><div class="balance-numbers"><strong>${credits.toLocaleString()}</strong><span>characters</span></div><div class="progress"><span style="width:72%"></span></div><div class="progress-label"><span>27,550 used this month</span><span>Developer plan</span></div><div class="balance-bottom"><div><small>Next renewal</small><b>October 30, 2026</b></div><span class="tag"><span class="tag-dot"></span>Active</span></div></section><section class="panel padded"><div class="panel-head"><div><h2>Credit rules</h2><p>Simple by design</p></div>${icon("info", 17)}</div><ul class="list-check"><li>One character equals one credit</li><li>Unused monthly credits reset on renewal</li><li>Purchased packs never expire</li></ul></section></div><section class="panel table-panel" style="margin-top:14px"><div class="panel-head" style="padding:22px 20px 0;margin-bottom:6px"><div><h2>Transaction ledger</h2><p>A clear record of every change</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance</th></tr></thead><tbody><tr><td>Sep 30</td><td><span class="tag">TTS</span></td><td><strong>Audio generation</strong></td><td style="color:var(--danger)">−81</td><td>72,450</td></tr><tr><td>Sep 01</td><td><span class="tag">BONUS</span></td><td><strong>Monthly plan allowance</strong></td><td style="color:var(--green)">+50,000</td><td>72,531</td></tr><tr><td>Aug 30</td><td><span class="tag">BONUS</span></td><td><strong>Registration credit</strong></td><td style="color:var(--green)">+10,000</td><td>22,531</td></tr></tbody></table></div></section>`; }
function usagePage() { return `<div class="dashboard-title"><div><span class="eyebrow">Know your usage</span><h1>Usage</h1><p>See what your workspace is doing over time.</p></div><select class="field-select" style="width:110px"><option>30 days</option><option>7 days</option><option>This year</option></select></div><div class="metric-grid"><div class="metric-box"><small>Characters</small><strong>27,550</strong><span class="stat-foot"><span class="change">+8.4%</span> vs last month</span></div><div class="metric-box"><small>API requests</small><strong>213</strong><span class="stat-foot"><span class="change">+14.2%</span> vs last month</span></div><div class="metric-box"><small>Average generation</small><strong>149 <small>chars</small></strong><span class="stat-foot">184 audio files</span></div></div><section class="panel chart-panel" style="margin-top:14px"><div class="panel-head"><div><h2>Daily character usage</h2><p>September 1 – 30, 2026</p></div><span class="tag">27,550 total</span></div><div class="usage-chart" style="height:260px">${[28, 32, 45, 39, 65, 52, 48, 71, 62, 80, 54, 68, 75, 64, 89, 72, 66, 91, 78, 61, 69, 82, 74, 86, 79, 95, 84, 76, 88, 92].map((height, i) => `<div class="bar-col"><div class="bar ${i === 29 ? "today" : ""}" style="height:${height}%"></div><label>${i + 1}</label></div>`).join("")}</div></section>`; }
function apiKeysPage() { const keys = store.get("keys", [{ name: "Production", masked: "sk_live_••••••••••••4f2a", date: "September 30, 2026", used: "Never" }]); return `<div class="dashboard-title"><div><span class="eyebrow">Developer access</span><h1>API keys</h1><p>Connect Neba to your product when your prototype is ready.</p></div><button class="btn btn-primary" data-action="create-key">${icon("plus", 14)} Create new key</button></div><div class="api-layout"><section class="panel padded"><div class="panel-head"><div><h2>Keys</h2><p>Keep secrets private and rotate them regularly.</p></div><span class="tag">${keys.length} active</span></div>${keys.map((key, index) => `<div class="key-row"><div class="key-main"><span class="key-icon">${icon("key", 16)}</span><div><strong>${esc(key.name)}</strong><small>${esc(key.masked)} · Created ${esc(key.date)}<br>Last used: ${esc(key.used)}</small></div></div><div class="key-actions"><button class="btn btn-danger" data-action="revoke-key" data-key-index="${index}">Revoke</button></div></div>`).join("")}<div class="notice" style="margin-top:18px">${icon("shield")}<span><b>Keep your key secret.</b> Never place a production key in browser code or a public repository.</span></div></section><section class="panel padded"><div class="panel-head"><div><h2>Request example</h2><p>Server-side only</p></div>${icon("terminal", 17)}</div><div class="code-block">curl -X POST /api/v1/tts \\\n  -H <span class="green">"Authorization: Bearer sk_live_..."</span> \\\n  -d <span class="orange">'{"text":"እንኳን ደህና መጡ።"}'</span></div><a class="btn btn-secondary btn-full" style="margin-top:17px" href="/dashboard/docs" data-route="/dashboard/docs">Read API docs ${icon("arrow", 14)}</a></section></div>`; }
function billingPage() { return `<div class="dashboard-title"><div><span class="eyebrow">Plan &amp; payments</span><h1>Billing</h1><p>Manage your subscription and payment history.</p></div><a class="btn btn-secondary" href="/pricing" data-route="/pricing">Compare plans ${icon("arrow", 14)}</a></div><section class="panel padded"><div class="panel-head"><div><h2>Current plan</h2><p>Your workspace is set up for regular production use.</p></div><span class="tag"><span class="tag-dot"></span>Active</span></div><div class="plan-current"><div><strong>Developer</strong><small>500,000 characters per month · Renews October 30, 2026</small></div><strong>200 ETB <span class="muted" style="font-size:10px;font-weight:400">/ month</span></strong></div><div style="display:flex;gap:9px;margin-top:18px"><button class="btn btn-secondary" data-action="billing-toast">Manage subscription</button><button class="btn btn-ghost" data-action="billing-toast">Cancel plan</button></div></section><section class="panel table-panel" style="margin-top:14px"><div class="panel-head" style="padding:22px 20px 0;margin-bottom:6px"><div><h2>Invoices</h2><p>Download your payment records</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody><tr><td><strong>INV-2026-00042</strong></td><td>Aug 30, 2026</td><td>Developer</td><td>200 ETB</td><td><span class="table-status">Paid</span></td><td><button class="btn btn-ghost">${icon("download", 13)}</button></td></tr></tbody></table></div></section><div class="notice">${icon("info")}<span><b>Payments are in preview.</b> Chapa, Telebirr, and invoice verification will be connected in the next product phase — credits will only be added after backend verification.</span></div>`; }
function dashboardDocsPage() { return `<div class="dashboard-title"><div><span class="eyebrow">Developer docs</span><h1>Build with Neba</h1><p>The shortest path from a sentence to an API response.</p></div><a class="btn btn-primary" href="/dashboard/api-keys" data-route="/dashboard/api-keys">Manage API keys ${icon("arrow", 14)}</a></div>${docsPage(true).replace(/<header[\s\S]*?<\/header>|<footer[\s\S]*<\/footer>/g, "").replace(/<section class="page-header">[\s\S]*?<\/section>/, "").replace(/<section class="page-content">/, "<section>")}`; }
function settingsPage() { return `<div class="dashboard-title"><div><span class="eyebrow">Your account</span><h1>Settings</h1><p>Keep your workspace details and preferences up to date.</p></div></div><div class="settings-grid"><section class="panel settings-panel"><h2>Profile</h2><p>This is how your workspace identifies you.</p><form id="profile-form"><div class="setting-field"><label class="field-label">Full name</label><input class="field-input" value="${esc(profile.name)}" /></div><div class="setting-field"><label class="field-label">Email address</label><input class="field-input" type="email" value="${esc(profile.email)}" /></div><div class="setting-field"><label class="field-label">Phone number</label><input class="field-input" placeholder="09..." /></div><button class="btn btn-primary" type="submit">Save changes</button></form></section><section class="panel settings-panel"><h2>Preferences</h2><p>Choose how Neba keeps you in the loop.</p><div class="toggle-row"><div><strong>Generation complete</strong><small>Notify me when long audio is ready.</small></div><button class="toggle on" data-action="toggle"></button></div><div class="toggle-row"><div><strong>Usage alerts</strong><small>Alert me when I reach 80% of my credits.</small></div><button class="toggle on" data-action="toggle"></button></div><div class="toggle-row"><div><strong>Product updates</strong><small>Occasional notes about new voices and tools.</small></div><button class="toggle" data-action="toggle"></button></div></section></div><div class="notice">${icon("shield")}<span><b>Authentication is currently a frontend preview.</b> Connect your session provider before using this workspace with real users.</span></div>`; }

function adminOverview() { return `<div class="admin-banner">${icon("alert", 18)}<div><strong>Admin preview mode</strong><span>These management views are frontend-only scaffolding. Sensitive actions will require a real backend and audit log.</span></div><span class="tag">SUPER_ADMIN</span></div><div class="dashboard-title"><div><span class="eyebrow">Operations</span><h1>Platform overview</h1><p>A high-level view of the Neba speech platform.</p></div><button class="btn btn-secondary" data-action="admin-toast">Export report ${icon("download", 14)}</button></div><div class="stats-grid"><div class="stat-card admin-kpi"><div class="stat-top"><span>Total users</span><span class="stat-icon">${icon("users", 15)}</span></div><div class="stat-value">12,842</div><div class="stat-foot"><span class="change">+12.4%</span> this month</div></div><div class="stat-card admin-kpi"><div class="stat-top"><span>Active users</span><span class="stat-icon">${icon("spark", 15)}</span></div><div class="stat-value">3,721</div><div class="stat-foot"><span class="change">68.2%</span> active rate</div></div><div class="stat-card admin-kpi"><div class="stat-top"><span>Today's TTS</span><span class="stat-icon">${icon("studio", 15)}</span></div><div class="stat-value">1.82M</div><div class="stat-foot"><span class="change">+18.4%</span> characters</div></div><div class="stat-card admin-kpi"><div class="stat-top"><span>Revenue</span><span class="stat-icon">${icon("wallet", 15)}</span></div><div class="stat-value">184.5k</div><div class="stat-foot">ETB · September</div></div></div><div class="dashboard-grid"><section class="panel chart-panel"><div class="panel-head"><div><h2>Platform activity</h2><p>Characters processed · last 14 days</p></div><span class="tag">Live preview</span></div><div class="usage-chart">${[42, 47, 51, 63, 57, 72, 68, 75, 74, 81, 88, 79, 91, 96].map((height, i) => `<div class="bar-col"><div class="bar ${i === 13 ? "today" : ""}" style="height:${height}%"></div><label>${i + 17}</label></div>`).join("")}</div></section><section class="panel padded"><div class="panel-head"><div><h2>Needs attention</h2><p>Operational signals</p></div></div><div class="activity-list"><div class="activity-row"><span class="activity-bullet" style="color:var(--orange)">${icon("alert", 13)}</span><div><strong>27 failed jobs</strong><small>Review the failed job queue</small></div><time>Today</time></div><div class="activity-row"><span class="activity-bullet">${icon("credit", 13)}</span><div><strong>14 pending payments</strong><small>Awaiting verification</small></div><time>Today</time></div><div class="activity-row"><span class="activity-bullet">${icon("users", 13)}</span><div><strong>8 new admin invites</strong><small>Awaiting acceptance</small></div><time>Week</time></div></div></section></div>`; }
function adminTablePage(type) { const users = type === "users"; const rows = users ? [["Ephrem Tadesse", "ephrem@example.com", "Developer", "72,450", "Active"], ["Meron Bekele", "meron@example.com", "Business", "1.2M", "Active"], ["Dawit Alemu", "dawit@example.com", "Free", "4,500", "Active"], ["Sara Worku", "sara@example.com", "Starter", "18,210", "Suspended"]] : [["PAY-2026-00931", "ephrem@example.com", "Chapa", "200 ETB", "SUCCESS"], ["PAY-2026-00930", "meron@example.com", "Telebirr", "600 ETB", "SUCCESS"], ["PAY-2026-00929", "dawit@example.com", "Chapa", "50 ETB", "PENDING"], ["PAY-2026-00928", "sara@example.com", "Chapa", "200 ETB", "FAILED"]]; return `<div class="dashboard-title"><div><span class="eyebrow">Admin / ${users ? "People" : "Finance"}</span><h1>${users ? "Users" : "Payments"}</h1><p>${users ? "Manage accounts, plans, and access." : "Review provider events and payment states."}</p></div><button class="btn btn-primary" data-action="admin-toast">${users ? "Invite admin" : "Export payments"} ${icon("arrow", 14)}</button></div><section class="panel table-panel"><div class="panel-head" style="padding:22px 20px 0;margin-bottom:6px"><div><h2>${users ? "All users" : "Recent payments"}</h2><p>${users ? "12,842 accounts" : "September 2026"}</p></div><input class="field-input" style="width:180px;min-height:34px" placeholder="Search..." /></div><div class="table-scroll"><table class="data-table"><thead><tr>${(users ? ["User", "Email", "Plan", "Credits", "Status", ""] : ["Payment", "User", "Provider", "Amount", "Status", ""]).map((head) => `<th>${head}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? `<strong>${cell}</strong>` : index === row.length - 1 ? `<span class="table-status" style="color:${cell === "FAILED" || cell === "Suspended" ? "var(--danger)" : cell === "PENDING" ? "var(--orange)" : "var(--green)"}">${cell}</span>` : cell}</td>`).join("")}<td><button class="btn btn-ghost" data-action="admin-toast">View ${icon("arrow", 12)}</button></td></tr>`).join("")}</tbody></table></div></section>`; }
function adminSimplePage(title, kicker, copy) { return `<div class="dashboard-title"><div><span class="eyebrow">Admin / ${kicker}</span><h1>${title}</h1><p>${copy}</p></div><span class="tag">Preview</span></div><section class="panel empty-state"><div class="feature-icon">${icon("studio", 21)}</div><h3>This management surface is ready for the backend.</h3><p>Queue state, filters, exports, and audit events will plug into this view as the platform services are added.</p></section>`; }

function renderDashboard(path) {
  let content;
  if (path === "/dashboard" || path === "") content = dashboardOverview();
  else if (path === "/dashboard/tts") content = studioPage();
  else if (path === "/dashboard/history") content = historyPage();
  else if (path === "/dashboard/credits") content = creditsPage();
  else if (path === "/dashboard/usage") content = usagePage();
  else if (path === "/dashboard/api-keys") content = apiKeysPage();
  else if (path === "/dashboard/billing") content = billingPage();
  else if (path === "/dashboard/docs") content = dashboardDocsPage();
  else if (path === "/dashboard/settings") content = settingsPage();
  else content = dashboardOverview();
  return appLayout(content, path);
}
function renderAdmin(path) {
  let content;
  if (path === "/admin") content = adminOverview();
  else if (path === "/admin/users") content = adminTablePage("users");
  else if (path === "/admin/payments") content = adminTablePage("payments");
  else if (path === "/admin/tts-jobs") content = adminSimplePage("TTS jobs", "Jobs", "Monitor queued, processing, completed, and failed synthesis jobs.");
  else if (path === "/admin/usage") content = adminSimplePage("API usage", "Usage", "Review character volume, request rate, and plan limits.");
  else content = adminSimplePage("Audit logs", "Security", "Sensitive admin actions should be recorded and reviewable.");
  return appLayout(content, path, true);
}

function render() {
  const path = currentPath();
  if (path.startsWith("/dashboard")) app.innerHTML = renderDashboard(path);
  else if (path.startsWith("/admin")) app.innerHTML = renderAdmin(path);
  else if (path === "/") app.innerHTML = homePage();
  else if (path === "/features") app.innerHTML = featuresPage();
  else if (path === "/demo") app.innerHTML = demoPage();
  else if (path === "/pricing") app.innerHTML = pricingPage();
  else if (path === "/docs") app.innerHTML = docsPage(false);
  else if (path === "/api") app.innerHTML = docsPage(true);
  else if (path === "/about") app.innerHTML = aboutPage();
  else if (path === "/contact") app.innerHTML = contactPage();
  else if (path === "/login") app.innerHTML = authPage("login");
  else if (path === "/register") app.innerHTML = authPage("register");
  else if (path === "/forgot-password") app.innerHTML = authPage("forgot");
  else app.innerHTML = homePage();
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll("a[data-route]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); navigate(link.dataset.route); }));
  document.querySelectorAll("[data-action]").forEach((element) => element.addEventListener("click", handleAction));
  const homeText = document.getElementById("home-demo-text");
  if (homeText) { const count = document.getElementById("home-demo-count"); const update = () => { count.textContent = `${homeText.value.length} / 1,000 characters`; }; homeText.addEventListener("input", update); update(); }
  if (document.getElementById("demo-text")) attachStudio("demo");
  if (document.getElementById("studio-text")) attachStudio("studio");
  document.getElementById("auth-form")?.addEventListener("submit", handleAuth);
  document.getElementById("profile-form")?.addEventListener("submit", (event) => { event.preventDefault(); toast("Profile changes saved for this preview."); });
}
async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "mobile-menu") { event.currentTarget.classList.toggle("open"); return; }
  if (action === "sidebar-toggle") { document.getElementById("sidebar")?.classList.toggle("open"); let overlay = document.querySelector(".mobile-sidebar-overlay"); if (!overlay) { overlay = document.createElement("div"); overlay.className = "mobile-sidebar-overlay"; document.body.appendChild(overlay); overlay.addEventListener("click", () => { document.getElementById("sidebar")?.classList.remove("open"); overlay.remove(); }); } return; }
  if (action === "logout") { store.set("session", false); toast("You have been logged out."); setTimeout(() => navigate("/"), 350); return; }
  if (action === "home-speak") { await homeSpeak(event.currentTarget); return; }
  if (action === "generate") { await requestAudio(event.currentTarget.dataset.studio); return; }
  if (action === "normalize") { await normalizeText(event.currentTarget.dataset.studio); return; }
  if (action === "create-key") { const keys = store.get("keys", [{ name: "Production", masked: "sk_live_••••••••••••4f2a", date: "September 30, 2026", used: "Never" }]); const secret = `sk_live_${Math.random().toString(36).slice(2, 18)}`; keys.push({ name: `Key ${keys.length + 1}`, masked: `${secret.slice(0, 10)}••••••${secret.slice(-4)}`, date: "September 30, 2026", used: "Never" }); store.set("keys", keys); toast(`New key created: ${secret} — copy it now; it will not be shown again.`); render(); return; }
  if (action === "revoke-key") { const keys = store.get("keys", []); keys.splice(Number(event.currentTarget.dataset.keyIndex), 1); store.set("keys", keys); toast("API key revoked."); render(); return; }
  if (action === "toggle") { event.currentTarget.classList.toggle("on"); return; }
  if (action === "notifications") { toast("You are all caught up."); return; }
  if (action === "history-play") { toast("History playback will be connected to stored audio files."); return; }
  if (action === "billing-toast" || action === "admin-toast") { toast("This action is ready for the backend integration."); return; }
}
async function homeSpeak(button) {
  const text = document.getElementById("home-demo-text")?.value.trim(); const wave = document.getElementById("home-wave"); const player = document.getElementById("home-player");
  if (!text) { toast("Write a sentence first.", "error"); return; }
  const original = button.innerHTML; button.disabled = true; button.innerHTML = `${icon("clock", 14)} Making it speak...`; wave?.classList.add("playing");
  try { if (API_BASE === null) throw new Error("Speech API is not connected. Add VITE_API_BASE_URL in Vercel project settings."); const response = await fetch(apiUrl("/speak"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang: "am", gender: "female", age: "adult", style: "friendly", rate: "-5%", pitch: "+0Hz", volume: "+0%", pause: 1, adaptive: true, normalize: true, format: "mp3" }) }); if (!response.ok || !(response.headers.get("content-type") || "").startsWith("audio/")) throw new Error("The speech engine is unavailable"); const blob = await response.blob(); const url = URL.createObjectURL(blob); player.src = url; player.style.display = "block"; player.play().catch(() => {}); toast("Your Amharic preview is ready."); } catch (error) { toast(error.message || "Could not generate the preview.", "error"); } finally { button.disabled = false; button.innerHTML = original; setTimeout(() => wave?.classList.remove("playing"), 1200); }
}
function handleAuth(event) { event.preventDefault(); const mode = event.currentTarget.dataset.authMode; const message = document.getElementById("auth-message"); if (mode === "forgot") { message.textContent = "If an account exists for that email, the reset instructions are ready in this preview."; message.classList.add("show"); return; } store.set("session", true); if (mode === "register") toast("Workspace created — welcome to Neba."); else toast("Welcome back, Ephrem."); setTimeout(() => navigate("/dashboard"), 350); }

window.addEventListener("popstate", render);
render();
