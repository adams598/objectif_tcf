"use client";

import React, { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  validateVideoFile,
  videoBlobPathname,
} from "@/lib/media/video-upload";

interface AdminMediaUploadProps {
  kind: "image" | "audio" | "video";
  label: string;
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  /** Lien externe (YouTube, etc.) — utile surtout pour la vidéo. */
  allowExternalLink?: boolean;
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
      ? "audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg"
      : kind === "image"
        ? "image/jpeg,image/png,image/webp,image/gif"
        : kind === "video"
          ? "video/mp4,video/webm,video/quicktime"
          : undefined;

  const uploadVideoClient = async (file: File) => {
    const validationError = validateVideoFile(file);
    if (validationError) throw new Error(validationError);

    const pathname = videoBlobPathname(file);
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload/video",
      contentType: file.type,
    });
    return blob.url;
  };

  const uploadMediaServer = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/admin/upload/media", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      success?: boolean;
      data?: { url: string };
      error?: string;
    };

    if (!response.ok || !payload.success || !payload.data?.url) {
      throw new Error(payload.error ?? "Échec de l'envoi du fichier");
    }

    return payload.data.url;
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    try {
      const url =
        kind === "video"
          ? await uploadVideoClient(file)
          : await uploadMediaServer(file);

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
      toast.error(
        error instanceof Error ? error.message : "Impossible d'envoyer le fichier"
      );
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
                ? "MP4, WebM ou MOV — envoi direct vers Vercel Blob (jusqu'à 150 Mo)."
                : "Depuis votre ordinateur ou téléphone — enregistrement automatique sur le cloud."}
            </p>
          )}
        </div>
      )}

      {value && kind === "image" && (
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
