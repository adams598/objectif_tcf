"use client";

import { cn } from "@/lib/utils";

interface ExamMediaPanelProps {
  imageUrl?: string | null;
  documentType?: string | null;
  fallbackIcon?: string;
  fallbackLabel?: string;
  className?: string;
  /** Si false, n’affiche rien quand il n’y a pas d’image (évite un gros placeholder mobile). */
  showFallback?: boolean;
}

/**
 * Panneau image d’examen — mobile : hauteur auto + object-contain
 * (object-cover + aspect-video cropait / cachait souvent le document).
 */
export function ExamMediaPanel({
  imageUrl,
  documentType,
  fallbackIcon = "image",
  fallbackLabel = "Document visuel",
  className,
  showFallback = true,
}: ExamMediaPanelProps) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative w-full bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-violet-sm",
          className
        )}
      >
        {documentType && (
          <span className="absolute z-10 top-2 left-2 md:top-md md:left-md inline-flex items-center gap-xs px-sm py-xs bg-surface/90 backdrop-blur-sm rounded-md font-label-sm text-label-sm text-on-surface shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">
              photo
            </span>
            {documentType}
          </span>
        )}
        {/* img natif : plus fiable que next/image fill sur mobile (Blob / tailles variables) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={documentType ?? fallbackLabel}
          className="block w-full h-auto max-h-[55vh] md:max-h-[70vh] object-contain bg-surface-container-low mx-auto"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  if (!showFallback) return null;

  return (
    <div
      className={cn(
        "bg-surface rounded-xl md:rounded-2xl border border-outline-variant aspect-[16/10] md:aspect-video flex items-center justify-center overflow-hidden shadow-violet-sm",
        className
      )}
    >
      <div className="text-center p-lg md:p-xl">
        <span className="material-symbols-outlined text-[48px] md:text-[64px] text-primary/30">
          {fallbackIcon}
        </span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm px-sm">
          {fallbackLabel}
        </p>
      </div>
    </div>
  );
}
