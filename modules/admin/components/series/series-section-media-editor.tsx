"use client";

import React from "react";
import { AdminMediaUpload } from "@/modules/admin/components/admin-media-upload";

interface SeriesSectionMediaEditorProps {
  audioUrl: string;
  videoUrl: string;
  saving: boolean;
  onAudioUrlChange: (url: string) => void;
  onVideoUrlChange: (url: string) => void;
}

export function SeriesSectionMediaEditor({
  audioUrl,
  videoUrl,
  saving,
  onAudioUrlChange,
  onVideoUrlChange,
}: SeriesSectionMediaEditorProps) {
  return (
    <div className="flex flex-col gap-md rounded-xl border border-outline-variant bg-surface p-md">
      <div>
        <h4 className="font-label-md text-label-md font-bold">
          Audio ou vidéo de toute la compréhension orale
        </h4>
        <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
          Un seul fichier pour les 39 questions. Il joue en continu : l’élève
          répond en dessous et passe lui-même à la question suivante. Choisissez
          soit un audio, soit une vidéo (pas les deux).
        </p>
        {saving && (
          <p className="font-label-sm text-[12px] text-primary mt-xs">
            Enregistrement du fichier…
          </p>
        )}
      </div>

      <AdminMediaUpload
        kind="audio"
        label="Audio unique (MP3, M4A…)"
        value={audioUrl}
        onChange={onAudioUrlChange}
      />
      <AdminMediaUpload
        kind="video"
        label="Vidéo unique (MP4…)"
        value={videoUrl}
        onChange={onVideoUrlChange}
      />
    </div>
  );
}
