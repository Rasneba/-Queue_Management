type Lang = "en" | "am" | "om";

const LANG_MAP: Record<Lang, string> = {
  en: "en-US",
  am: "am-ET",
  om: "om-ET",
};

const TTS_SERVER_URL = "http://localhost:8765";

let currentAudio: HTMLAudioElement | null = null;

async function isTTSServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${TTS_SERVER_URL}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function speakViaServer(text: string, lang: Lang): Promise<boolean> {
  try {
    const res = await fetch(`${TTS_SERVER_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, rate: "-10%", pitch: "+0Hz" }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
    }

    currentAudio = new Audio(url);
    currentAudio.play();
    return true;
  } catch {
    return false;
  }
}

async function speakQueueViaServer(
  ticket: string,
  counter: string,
  lang: Lang,
  department?: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${TTS_SERVER_URL}/queue-speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket, counter, lang, department, rate: "-10%", pitch: "+0Hz" }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
    }

    currentAudio = new Audio(url);
    currentAudio.play();
    return true;
  } catch {
    return false;
  }
}

function speakViaBrowser(text: string, lang: Lang, rate: number = 0.85): void {
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_MAP[lang];
  utterance.rate = rate;
  utterance.pitch = 1.0;

  const voices = synth.getVoices();
  const targetLang = LANG_MAP[lang];
  const voice = voices.find((v) => v.lang === targetLang) || voices.find((v) => v.lang.startsWith(lang));
  if (voice) utterance.voice = voice;

  synth.speak(utterance);
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

export async function speakTicket(ticketId: string, roomNumber: string, options: TTSOptions = {}): Promise<void> {
  const { lang = "am", department } = options;

  const serverUp = await isTTSServerAvailable();
  if (serverUp) {
    await speakQueueViaServer(ticketId, roomNumber, lang, department);
  } else {
    const fallbackText = `Patient number ${ticketId}, please proceed to counter number ${roomNumber}`;
    speakViaBrowser(fallbackText, lang);
  }
}

export async function speakText(text: string, lang: Lang = "am"): Promise<void> {
  const serverUp = await isTTSServerAvailable();
  if (serverUp) {
    await speakViaServer(text, lang);
  } else {
    speakViaBrowser(text, lang);
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

interface TTSOptions {
  lang?: Lang;
  rate?: number;
  pitch?: number;
  volume?: number;
  department?: string;
}
