"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ExamMediaPanelProps {
  imageUrl?: string | null;
  documentType?: string | null;
  fallbackIcon?: string;
  fallbackLabel?: string;
  className?: string;
}

export function ExamMediaPanel({
  imageUrl,
  documentType,
  fallbackIcon = "image",
  fallbackLabel = "Document visuel",
  className,
}: ExamMediaPanelProps) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative bg-surface rounded-2xl border border-outline-variant aspect-video overflow-hidden shadow-violet-sm",
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={documentType ?? fallbackLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          unoptimized
        />
        {documentType && (
          <span className="absolute top-md left-md inline-flex items-center gap-xs px-sm py-xs bg-surface/90 backdrop-blur-sm rounded-md font-label-sm text-label-sm text-on-surface shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">
              photo
            </span>
            {documentType}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-surface rounded-2xl border border-outline-variant aspect-video flex items-center justify-center overflow-hidden shadow-violet-sm",
        className
      )}
    >
      <div className="text-center p-xl">
        <span className="material-symbols-outlined text-[64px] text-primary/30">
          {fallbackIcon}
        </span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
          {fallbackLabel}
        </p>
      </div>
    </div>
  );
}
