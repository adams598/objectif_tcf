import { NextRequest } from "next/server";
import { synthesizeFrenchSpeech } from "@/lib/examen/media/tts";
import {
  errorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const text = req.nextUrl.searchParams.get("text");

    if (!text || text.trim().length < 2) {
      return errorResponse("Paramètre text requis", 400);
    }

    if (text.length > 2000) {
      return errorResponse("Texte trop long", 400);
    }

    const audio = await synthesizeFrenchSpeech(text);

    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return serverErrorResponse(error);
  }
}
