import { getCurrentUser } from "@/lib/auth/session";
import { subscribeUser, type RealtimeEvent } from "@/lib/realtime/hub";
import { errorResponse } from "@/lib/utils/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Non authentifié", 401);
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      unsubscribe = subscribeUser(user.userId, send);
      controller.enqueue(encoder.encode(`: connected\n\n`));

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 25_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  req.signal.addEventListener("abort", () => {
    if (heartbeat) clearInterval(heartbeat);
    unsubscribe?.();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
