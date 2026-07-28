import { onPatientChange, getListenerCount } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const MAX_SSE_CONNECTIONS = 50;

export async function GET(request: Request) {
  if (getListenerCount() >= MAX_SSE_CONNECTIONS) {
    return new Response(JSON.stringify({ error: "Too many connections" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Retry-After": "5" },
    });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const safeClose = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const send = (event: { type: string }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          safeClose();
        }
      };

      send({ type: "connected" });

      unsubscribe = onPatientChange((e) => send(e));

      heartbeat = setInterval(() => send({ type: "ping" }), 15000);

      request.signal.addEventListener("abort", safeClose);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
