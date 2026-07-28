import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const VOICE_MAP: Record<string, string> = {
  en: "en-US-JennyNeural",
  am: "am-ET-MekdesNeural",
  om: "om-ET-MekdesNeural",
};

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

interface TTSRequestBody {
  text: string;
  lang?: string;
  rate?: string;
  pitch?: string;
}

function uuidNoDash(): string {
  return randomUUID().replace(/-/g, "");
}

function buildSSML(text: string, voice: string, rate: string, pitch: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${voice}'>` +
    `<prosody pitch='${pitch}' rate='${rate}'>` +
    escaped +
    `</prosody></voice></speak>`
  );
}

function synthesizeViaWebSocket(
  text: string,
  voice: string,
  rate: string,
  pitch: string,
  timeoutMs = 15000
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const connId = uuidNoDash();
    const url =
      `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
      `?TrustedClientToken=${TRUSTED_TOKEN}&ConnectionId=${connId}`;

    const ws = new WebSocket(url);
    const audioChunks: Buffer[] = [];
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ws.close();
        reject(new Error("WebSocket TTS timeout"));
      }
    }, timeoutMs);

    ws.onopen = () => {
      const config = {
        context: {
          synthesis: {
            audio: {
              metadataOptions: {
                sentenceBoundaryEnabled: "false",
                wordBoundaryEnabled: "false",
              },
              outputFormat: "audio-24khz-48kbitrate-mono-mp3",
            },
          },
        },
      };
      ws.send(
        `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify(config)}`
      );

      const requestId = uuidNoDash();
      const ssml = buildSSML(text, voice, rate, pitch);
      ws.send(
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        if (event.data.includes("Path:turn.end")) {
          clearTimeout(timer);
          resolved = true;
          ws.close();
          const total = Buffer.concat(audioChunks);
          resolve(total.buffer.slice(total.byteOffset, total.byteOffset + total.byteLength));
        }
      } else if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        const headerLenBytes = new Uint8Array(data.buffer, data.byteOffset, 2);
        const headerLen = (headerLenBytes[0] << 8) | headerLenBytes[1];
        const audioData = data.slice(2 + headerLen);
        if (audioData.length > 0) {
          audioChunks.push(Buffer.from(audioData));
        }
      } else if (typeof Blob !== "undefined" && event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => {
          const data = new Uint8Array(buf);
          if (data.length > 4) {
            const headerLen = (data[0] << 8) | data[1];
            const audioData = data.slice(2 + headerLen);
            if (audioData.length > 0) {
              audioChunks.push(Buffer.from(audioData));
            }
          }
        });
      }
    };

    ws.onerror = (err: Event) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        reject(new Error(`WebSocket TTS error: ${err.type || "unknown"}`));
      }
    };

    ws.onclose = () => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        if (audioChunks.length > 0) {
          const total = Buffer.concat(audioChunks);
          resolve(total.buffer.slice(total.byteOffset, total.byteOffset + total.byteLength));
        } else {
          reject(new Error("WebSocket TTS closed with no audio"));
        }
      }
    };
  });
}

async function synthesizeViaGoogle(
  text: string,
  lang: string
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body: TTSRequestBody = await request.json();
    const { text, lang = "am", rate = "-10%", pitch = "+0Hz" } = body;

    if (!text || typeof text !== "string") {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const voice = VOICE_MAP[lang] || VOICE_MAP["am"];

    try {
      const audio = await synthesizeViaWebSocket(text, voice, rate, pitch);
      return new Response(audio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename=tts_${lang}.mp3`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      const googleAudio = await synthesizeViaGoogle(text, lang);
      if (googleAudio) {
        return new Response(googleAudio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Disposition": `inline; filename=tts_${lang}.mp3`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      return Response.json(
        { error: "TTS generation failed on all providers" },
        { status: 503 }
      );
    }
  } catch (err) {
    return Response.json(
      { error: `TTS error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
