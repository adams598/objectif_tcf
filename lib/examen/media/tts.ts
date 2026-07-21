import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const VOICE = "fr-CA-SylvieNeural";
const MAX_CHARS = 2000;

/** Cache mémoire simple pour limiter les appels TTS répétés */
const audioCache = new Map<string, Buffer>();
const MAX_CACHE = 200;

export async function synthesizeFrenchSpeech(text: string): Promise<Buffer> {
  const normalized = text.trim().slice(0, MAX_CHARS);
  if (!normalized) {
    throw new Error("Texte vide");
  }

  const cacheKey = normalized.slice(0, 120);
  const cached = audioCache.get(cacheKey);
  if (cached) return cached;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(normalized);

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  if (audioCache.size >= MAX_CACHE) {
    const first = audioCache.keys().next().value;
    if (first) audioCache.delete(first);
  }
  audioCache.set(cacheKey, buffer);

  return buffer;
}
