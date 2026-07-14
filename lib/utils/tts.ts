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

export async function speakTicket(ticketId: string, roomNumber: string, options: TTSOptions = {}): Promise<void> {
  const { department } = options;
  const serverUp = await isTTSServerAvailable();

  if (serverUp) {
    await speakQueueViaServer(ticketId, roomNumber, "am", department);
    await new Promise(r => setTimeout(r, 400));
    await speakQueueViaServer(ticketId, roomNumber, "en", department);
  } else {
    await speakViaBrowser(`ተጠራ ቁጥር ${ticketId}፣ ወደ መቀበያ ቁጥር ${roomNumber} ይምጡ`, "am");
    await new Promise(r => setTimeout(r, 300));
    await speakViaBrowser(`Patient number ${ticketId}, please proceed to counter number ${roomNumber}`, "en");
  }
}

export async function speakText(textAmharic: string, textEnglish: string): Promise<void> {
  const serverUp = await isTTSServerAvailable();

  if (serverUp) {
    await speakQueueViaServer("speak", "", "am");
    const resAm = await fetch(`${TTS_SERVER_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textAmharic, lang: "am", rate: "-10%", pitch: "+0Hz" }),
    });
    if (resAm.ok) {
      const blob = await resAm.blob();
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        if (currentAudio) { currentAudio.pause(); currentAudio.src = ""; }
        currentAudio = audio;
        audio.play().catch(() => resolve());
      });
    }
    await new Promise(r => setTimeout(r, 400));
    const resEn = await fetch(`${TTS_SERVER_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textEnglish, lang: "en", rate: "-10%", pitch: "+0Hz" }),
    });
    if (resEn.ok) {
      const blob = await resEn.blob();
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        if (currentAudio) { currentAudio.pause(); currentAudio.src = ""; }
        currentAudio = audio;
        audio.play().catch(() => resolve());
      });
    }
  } else {
    await speakViaBrowser(textAmharic, "am");
    await new Promise(r => setTimeout(r, 300));
    await speakViaBrowser(textEnglish, "en");
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
