"use client";

import React, { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  contentMediaBlobPathname,
  maxBytesLabel,
  validateContentMediaFile,
  type ContentMediaKind,
} from "@/lib/media/content-media-types";

interface AdminMediaUploadProps {
  kind: ContentMediaKind;
  label: string;
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  allowExternalLink?: boolean;
}

function isBrowserLocalhost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function formatUploadError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Impossible d'envoyer le fichier";

  if (
    message.includes("Unexpected token") ||
    message.includes("is not valid JSON") ||
    message.includes("Request Entity") ||
    message.includes("Too Large") ||
    message.includes("413")
  ) {
    return "Fichier trop volumineux pour l'ancien upload serveur. Rechargez la page (Ctrl+F5) puis réessayez — l'envoi doit aller vers Vercel Blob.";
  }

  if (
    message.includes("BLOB") ||
    message.includes("Vercel Blob") ||
    message.includes("client token") ||
    message.includes("Failed to retrieve")
  ) {
    return "Vercel Blob non configuré ou inaccessible (BLOB_READ_WRITE_TOKEN). Vérifiez Storage → Blob sur Vercel.";
  }

  return message;
}

export function AdminMediaUpload({
  kind,
  label,
  value,
  onChange,
  className,
  allowExternalLink,
}: AdminMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [showLinkOption, setShowLinkOption] = useState(kind === "video");

  const supportsFileUpload =
    kind === "image" || kind === "audio" || kind === "video";
  const showLink =
    allowExternalLink ?? (kind === "video" || supportsFileUpload);

  const accept =
    kind === "audio"
      ? "audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4"
      : kind === "image"
        ? "image/jpeg,image/png,image/webp,image/gif"
        : kind === "video"
          ? "video/mp4,video/webm,video/quicktime"
          : undefined;

  /**
   * Navigateur → token JSON (petit) → fichier direct vers Blob.
   * Ne passe JAMAIS le fichier dans le body d'une API Route Vercel.
   */
  const uploadViaBlobClient = async (file: File) => {
    const validationError = validateContentMediaFile(file, kind);
    if (validationError) throw new Error(validationError);

    const pathname = contentMediaBlobPathname(kind, file);
    const useMultipart = file.size > 4 * 1024 * 1024;

    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload/blob",
      contentType: file.type || undefined,
      multipart: useMultipart,
    });
    return blob.url;
  };

  /** Uniquement localhost sans Blob — jamais sur Vercel. */
  const uploadMediaLocalFallback = async (file: File) => {
    if (kind === "video") {
      throw new Error("Vidéo : Vercel Blob requis (BLOB_READ_WRITE_TOKEN).");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/admin/upload/media", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    let payload: {
      success?: boolean;
      data?: { url: string };
      error?: string;
    } = {};
    try {
      payload = JSON.parse(text) as typeof payload;
    } catch {
      throw new Error(
        response.status === 413
          ? "Fichier trop volumineux pour l'upload local."
          : text.slice(0, 120) || "Échec de l'envoi"
      );
    }

    if (!response.ok || !payload.success || !payload.data?.url) {
      throw new Error(payload.error ?? "Échec de l'envoi du fichier");
    }

    return payload.data.url;
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    try {
      let url: string;
      try {
        url = await uploadViaBlobClient(file);
      } catch (blobError) {
        // Fallback FormData uniquement en local (pas de limite 4,5 Mo Vercel)
        if (!isBrowserLocalhost()) {
          throw blobError;
        }
        url = await uploadMediaLocalFallback(file);
      }

      onChange(url);
      setExternalUrl("");
      toast.success(
        kind === "audio"
          ? "Audio enregistré sur le cloud"
          : kind === "video"
            ? "Vidéo enregistrée sur Vercel Blob"
            : "Image enregistrée sur le cloud"
      );
    } catch (error) {
      toast.error(formatUploadError(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const applyExternalUrl = () => {
    const url = externalUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Le lien doit commencer par http:// ou https://");
      return;
    }
    onChange(url);
    toast.success("Lien enregistré");
  };

  const uploadLabel =
    kind === "audio"
      ? "Choisir un fichier audio"
      : kind === "image"
        ? "Choisir une image"
        : kind === "video"
          ? "Choisir une vidéo"
          : null;

  return (
    <div className={cn("flex flex-col gap-sm", className)}>
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </span>

      {supportsFileUpload && (
        <div className="flex flex-col gap-sm">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-sm">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[18px]">
                {kind === "audio"
                  ? "upload_file"
                  : kind === "video"
                    ? "movie"
                    : "add_photo_alternate"}
              </span>
              {uploading ? "Envoi en cours…" : uploadLabel}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("");
                  setExternalUrl("");
                }}
              >
                Retirer
              </Button>
            )}
          </div>
          {!value && (
            <p className="font-label-sm text-[11px] text-on-surface-variant">
              {kind === "video"
                ? `MP4, WebM ou MOV — envoi direct Vercel Blob (max ${maxBytesLabel(kind)}).`
                : kind === "audio"
                  ? `MP3, WAV, WebM, OGG — envoi direct cloud (max ${maxBytesLabel(kind)}), hors limite serveur.`
                  : `JPEG, PNG, WebP, GIF — max ${maxBytesLabel(kind)}.`}
            </p>
          )}
        </div>
      )}

      {value && kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="max-h-36 rounded-lg border border-outline-variant object-contain bg-surface-container"
        />
      )}
      {value && kind === "audio" && (
        <audio controls src={value} className="w-full max-w-md" />
      )}
      {value && kind === "video" && (
        <video
          controls
          src={value}
          className="w-full max-w-md rounded-lg border border-outline-variant bg-black/5"
        />
      )}

      {value && supportsFileUpload && (
        <p className="font-label-sm text-[11px] text-success flex items-center gap-xs">
          <span className="material-symbols-outlined text-[14px]">cloud_done</span>
          Fichier enregistré — accessible aux apprenants
        </p>
      )}

      {showLink && (
        <div className="mt-xs">
          {supportsFileUpload && (
            <button
              type="button"
              className="font-label-sm text-[11px] text-primary hover:underline mb-xs"
              onClick={() => setShowLinkOption((v) => !v)}
            >
              {showLinkOption
                ? "Masquer l'option lien externe"
                : "Ou coller un lien externe (option avancée)"}
            </button>
          )}
          {(showLinkOption || kind === "video") && (
            <div className="flex flex-wrap items-center gap-sm">
              <Input
                placeholder={
                  kind === "video"
                    ? "Lien vidéo (YouTube, Vimeo, MP4…)"
                    : "Lien https://… (optionnel)"
                }
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!externalUrl.trim()}
                onClick={applyExternalUrl}
              >
                Utiliser ce lien
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
