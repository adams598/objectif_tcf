"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminMediaUploadProps {
  kind: "image" | "audio";
  label: string;
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function AdminMediaUpload({
  kind,
  label,
  value,
  onChange,
  className,
}: AdminMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const accept =
    kind === "audio"
      ? "audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg"
      : "image/jpeg,image/png,image/webp,image/gif";

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    try {
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
        throw new Error(payload.error ?? "Échec de l'upload");
      }

      onChange(payload.data.url);
      toast.success(kind === "audio" ? "Audio enregistré" : "Image enregistrée");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible d'envoyer le fichier"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-sm", className)}>
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-sm">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <span className="material-symbols-outlined text-[18px]">
            {kind === "audio" ? "upload_file" : "image"}
          </span>
          {uploading
            ? "Envoi…"
            : kind === "audio"
              ? "Charger un audio"
              : "Charger une image"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
          >
            Retirer
          </Button>
        )}
      </div>
      {value && kind === "image" && (
        <img
          src={value}
          alt=""
          className="max-h-32 rounded-lg border border-outline-variant object-contain"
        />
      )}
      {value && kind === "audio" && (
        <audio controls src={value} className="w-full max-w-md" />
      )}
      {value && (
        <p className="font-label-sm text-[11px] text-on-surface-variant break-all">
          {value}
        </p>
      )}
    </div>
  );
}
