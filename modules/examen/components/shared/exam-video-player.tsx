"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  isBlobVideoUrl,
  isEmbeddableVideoUrl,
} from "@/lib/media/video-upload";

interface ExamVideoPlayerProps {
  videoUrl: string;
  label?: string;
  className?: string;
}

function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function ExamVideoPlayer({
  videoUrl,
  label = "Document vidéo",
  className,
}: ExamVideoPlayerProps) {
  const embedUrl = isEmbeddableVideoUrl(videoUrl)
    ? toEmbedUrl(videoUrl)
    : null;

  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant/60 bg-surface-container">
        <span className="material-symbols-outlined text-primary text-[20px]">
          play_circle
        </span>
        <span className="font-label-md text-label-md font-semibold text-on-surface">
          {label}
        </span>
      </div>

      {embedUrl ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={label}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          controls
          playsInline
          preload="metadata"
          src={videoUrl}
          className="aspect-video w-full bg-black/90"
        />
      )}

      {isBlobVideoUrl(videoUrl) && (
        <p className="px-md py-xs font-label-sm text-[11px] text-on-surface-variant">
          Vidéo hébergée sur le cloud Objectif TCF
        </p>
      )}
    </div>
  );
}
