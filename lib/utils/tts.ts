type Lang = "en" | "am" | "om";

const LANG_MAP: Record<Lang, string> = {
  en: "en-US",
  am: "am-ET",
  om: "om-ET",
};

const TTS_API_URL = "/api/tts";
const TTS_LOCAL_URL = "http://localhost:8765";

let currentAudio: HTMLAudioElement | null = null;

async function speakViaAPI(
  text: string,
  lang: Lang,
  rate: string = "-10%",
  pitch: string = "+0Hz"
): Promise<boolean> {
  try {
    const res = await fetch(TTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, rate, pitch }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    if (blob.size < 100) return false;
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      if (currentAudio) { currentAudio.pause(); currentAudio.src = ""; }
      currentAudio = audio;
      audio.play().catch(() => resolve(false));
    });
  } catch {
    return false;
  }
}

async function isLocalTTSServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${TTS_LOCAL_URL}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function speakViaLocalServer(
  text: string,
  lang: Lang,
  rate: string = "-10%",
  pitch: string = "+0Hz"
): Promise<boolean> {
  try {
    const res = await fetch(`${TTS_LOCAL_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, rate, pitch }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      if (currentAudio) { currentAudio.pause(); currentAudio.src = ""; }
      currentAudio = audio;
      audio.play().catch(() => resolve(false));
    });
  } catch {
    return false;
  }
}

function speakViaBrowser(text: string, lang: Lang, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) { resolve(); return; }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[lang];
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voices = synth.getVoices();
    const targetLang = LANG_MAP[lang];
    const voice = voices.find((v) => v.lang === targetLang) || voices.find((v) => v.lang.startsWith(lang));
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

export function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window?.speechSynthesis;
    if (!synth) { resolve([]); return; }

    const voices = synth.getVoices();
    if (voices.length > 0) { resolve(voices); return; }

    const onLoaded = () => {
      synth.removeEventListener("voiceschanged", onLoaded);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", onLoaded);
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", onLoaded);
      resolve(synth.getVoices());
    }, 2000);
  });
}

function speakWithFallback(
  amharicText: string,
  englishText: string
): { am: Promise<void>; en: Promise<void> } {
  return {
    am: speakViaAPI(amharicText, "am").then((ok) => {
      if (!ok) return speakViaBrowser(amharicText, "am");
    }),
    en: speakViaAPI(englishText, "en").then((ok) => {
      if (!ok) return speakViaBrowser(englishText, "en");
    }),
  };
}

export async function speakTicket(ticketId: string, roomNumber: string, options: TTSOptions = {}): Promise<void> {
  const { department } = options;
  const deptAm = department ? getDeptAmharic(department) : "";
  const deptPart = deptAm ? `${deptAm} ` : "";

  const amharicText = `እንግዳ ቁጥር ${ticketId}፣ ወደ ${deptPart}መቀበያ ቁጥር ${roomNumber} ይምጡ`;
  const englishText = `Patient number ${ticketId}, please proceed to ${department ? department + " " : ""}counter number ${roomNumber}`;

  const localUp = await isLocalTTSServerAvailable();

  if (localUp) {
    const amOK = await speakViaLocalServer(amharicText, "am");
    if (amOK) await new Promise((r) => setTimeout(r, 400));
    await speakViaLocalServer(englishText, "en");
  } else {
    const amOK = await speakViaAPI(amharicText, "am");
    if (amOK) await new Promise((r) => setTimeout(r, 400));
    if (!amOK) {
      await speakViaBrowser(amharicText, "am");
      await new Promise((r) => setTimeout(r, 300));
    }
    const enOK = await speakViaAPI(englishText, "en");
    if (!enOK) {
      await speakViaBrowser(englishText, "en");
    }
  }
}

export async function speakText(textAmharic: string, textEnglish: string): Promise<void> {
  const localUp = await isLocalTTSServerAvailable();

  if (localUp) {
    const amOK = await speakViaLocalServer(textAmharic, "am");
    if (amOK) await new Promise((r) => setTimeout(r, 400));
    await speakViaLocalServer(textEnglish, "en");
  } else {
    const amOK = await speakViaAPI(textAmharic, "am");
    if (amOK) await new Promise((r) => setTimeout(r, 400));
    if (!amOK) {
      await speakViaBrowser(textAmharic, "am");
      await new Promise((r) => setTimeout(r, 300));
    }
    const enOK = await speakViaAPI(textEnglish, "en");
    if (!enOK) {
      await speakViaBrowser(textEnglish, "en");
    }
  }
}

export function stopSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

export function isSpeaking(): boolean {
  if (currentAudio && !currentAudio.paused) return true;
  return window.speechSynthesis?.speaking ?? false;
}

export function getVoiceStatus(): { ready: boolean; count: number; amharic: boolean; languages: string[] } {
  const voices = window?.speechSynthesis?.getVoices() || [];
  return {
    ready: voices.length > 0,
    count: voices.length,
    amharic: voices.some(v => v.lang.startsWith("am")),
    languages: [...new Set(voices.map(v => v.lang))],
  };
}

function getDeptAmharic(dept: string): string {
  const map: Record<string, string> = {
    "General Medicine": "አጠቃላይ",
    "Cardiology": "የልብ",
    "Pediatrics": "የህጻናት",
    "Orthopedics": "የአጥንት",
    "Emergency": "የድንገተኛ",
    "Neurology": "የነርቭ",
    "Oncology": "የዐንክሎክ",
    "Gynecology": "የሴቶች",
    "ENT": "የትንኝ",
    "Dermatology": "የቆዳ",
    "Ophthalmology": "የአይን",
    "Radiology": "የሬዲዮሎጂ",
    "Laboratory": "የላቦራቶሪ",
    "Pharmacy": "ፋርማሲ",
  };
  return map[dept] || "";
}

interface TTSOptions {
  lang?: Lang;
  rate?: number;
  pitch?: number;
  volume?: number;
  department?: string;
}
