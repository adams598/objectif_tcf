/** Helpers partagés client/serveur pour uploads médias (sans imports Node). */

export type ContentMediaKind = "image" | "audio" | "video" | "media";

export const IMAGE_MIME_LIST = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const AUDIO_MIME_LIST = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
  "audio/x-m4a",
  "audio/m4a",
] as const;

export const VIDEO_MIME_LIST = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/x-msvideo",
  "video/avi",
  "video/mpeg",
  "video/3gpp",
  "video/x-matroska",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

const IMAGE_MIME = new Set<string>(IMAGE_MIME_LIST);
const AUDIO_MIME = new Set<string>(AUDIO_MIME_LIST);
const VIDEO_MIME = new Set<string>(VIDEO_MIME_LIST);

const AUDIO_EXT = new Set([
  "mp3",
  "wav",
  "ogg",
  "oga",
  "webm",
  "m4a",
  "aac",
  "flac",
  "opus",
]);
const VIDEO_EXT = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
  "avi",
  "mkv",
  "mpeg",
  "mpg",
  "3gp",
]);
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Déduit audio | video | image depuis mime ou extension (Windows envoie souvent mime vide). */
export function detectMediaKindFromFile(
  file: File
): "audio" | "video" | "image" | null {
  const mime = (file.type || "").toLowerCase();
  const ext = fileExtension(file.name);

  if (mime.startsWith("audio/") || AUDIO_MIME.has(mime) || AUDIO_EXT.has(ext)) {
    return "audio";
  }
  if (mime.startsWith("video/") || VIDEO_MIME.has(mime) || VIDEO_EXT.has(ext)) {
    return "video";
  }
  if (mime.startsWith("image/") || IMAGE_MIME.has(mime) || IMAGE_EXT.has(ext)) {
    return "image";
  }
  return null;
}

function extensionForFile(kind: ContentMediaKind, file: File): string {
  const ext = fileExtension(file.name);
  if (ext && /^[a-z0-9]{1,8}$/i.test(ext)) return ext.toLowerCase();

  const mime = file.type;
  if (kind === "audio" || (kind === "media" && mime.startsWith("audio/"))) {
    if (mime.includes("wav")) return "wav";
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
    return "mp3";
  }
  if (kind === "video" || (kind === "media" && mime.startsWith("video/"))) {
    if (mime.includes("webm")) return "webm";
    if (mime.includes("quicktime") || mime.includes("m4v")) return "mov";
    if (mime.includes("avi")) return "avi";
    if (mime.includes("matroska")) return "mkv";
    return "mp4";
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function contentMediaSubdir(kind: ContentMediaKind): string {
  if (kind === "audio") return "content/audio";
  if (kind === "video" || kind === "media") return "content/video";
  return "content/images";
}

export function contentMediaBlobPathname(
  kind: ContentMediaKind,
  file: File
): string {
  const detected = detectMediaKindFromFile(file);
  const effective: ContentMediaKind =
    kind === "media" && detected ? detected : kind;
  const subdir =
    effective === "audio"
      ? "content/audio"
      : effective === "video"
        ? "content/video"
        : "content/images";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${subdir}/${id}.${extensionForFile(effective, file)}`;
}

export function validateContentMediaFile(
  file: File,
  kind: ContentMediaKind
): string | null {
  const detected = detectMediaKindFromFile(file);

  if (kind === "media") {
    if (detected !== "audio" && detected !== "video") {
      return "Choisissez un fichier audio ou vidéo.";
    }
    const max =
      detected === "audio" ? MAX_AUDIO_BYTES : MAX_VIDEO_BYTES;
    if (file.size > max) {
      return detected === "audio"
        ? "L'audio ne doit pas dépasser 25 Mo."
        : "La vidéo ne doit pas dépasser 150 Mo.";
    }
    return null;
  }

  if (kind === "audio") {
    if (detected !== "audio" && !file.type.startsWith("audio/") && !AUDIO_EXT.has(fileExtension(file.name))) {
      // Accepte tout fichier audio/* ou extension connue ; sinon tolère mime vide + extension audio
      if (!(file.type === "" && AUDIO_EXT.has(fileExtension(file.name)))) {
        if (detected && detected !== "audio") {
          return "Ce fichier n'est pas un audio. Utilisez l'upload vidéo si besoin.";
        }
      }
    }
    // Très permissif : si l’admin force un fichier, on accepte sauf image évidente
    if (detected === "image") {
      return "Format image non accepté ici — utilisez l'upload image.";
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return "L'audio ne doit pas dépasser 25 Mo.";
    }
    return null;
  }

  if (kind === "video") {
    if (detected === "image") {
      return "Format image non accepté ici — utilisez l'upload image.";
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return "La vidéo ne doit pas dépasser 150 Mo.";
    }
    return null;
  }

  // image
  if (detected && detected !== "image") {
    return "Format image non supporté (JPEG, PNG, WebP, GIF).";
  }
  if (!detected && file.type && !IMAGE_MIME.has(file.type)) {
    return "Format image non supporté (JPEG, PNG, WebP, GIF).";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "L'image ne doit pas dépasser 5 Mo.";
  }
  return null;
}

export function maxBytesLabel(kind: ContentMediaKind): string {
  if (kind === "audio") return "25 Mo";
  if (kind === "video" || kind === "media") return "150 Mo";
  return "5 Mo";
}

export function acceptAttributeForKind(kind: ContentMediaKind): string {
  if (kind === "image") return "image/jpeg,image/png,image/webp,image/gif";
  if (kind === "media") return "audio/*,video/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.webm,.mov,.avi,.mkv,.m4v";
  if (kind === "audio") return "audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm";
  return "video/*,.mp4,.webm,.mov,.avi,.mkv,.m4v";
}
