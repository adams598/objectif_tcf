"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCueTime } from "@/lib/series/video-cues";
import type { SegmentedPhase } from "@/modules/examen/hooks/use-segmented-series-video";

interface SegmentedExamVideoProps {
  videoUrl: string;
  rangeStart: number;
  rangeEnd: number;
  phase: SegmentedPhase;
  label?: string;
  startLabel: string;
  watchingLabel: string;
  pausedLabel: string;
  playAria: string;
  pauseAria: string;
  onStart: () => void;
  onReachedEnd: () => void;
  className?: string;
}

export function SegmentedExamVideo({
  videoUrl,
  rangeStart,
  rangeEnd,
  phase,
  label = "Document vidéo",
  startLabel,
  watchingLabel,
  pausedLabel,
  playAria,
  pauseAria,
  onStart,
  onReachedEnd,
  className,
}: SegmentedExamVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reachedRef = useRef(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    reachedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    if (phase === "playing") {
      const startAt = Math.max(0, rangeStart);
      if (Math.abs(video.currentTime - startAt) > 0.35) {
        video.currentTime = startAt;
      }
      const play = video.play();
      if (play) void play.catch(() => undefined);
      return;
    }

    video.pause();
    if (phase === "paused") {
      video.currentTime = Math.max(0, rangeEnd);
    } else {
      video.currentTime = 0;
    }
  }, [phase, rangeStart, rangeEnd, videoUrl]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || phase !== "playing") return;

    if (video.currentTime < rangeStart - 0.05) {
      video.currentTime = rangeStart;
      return;
    }

    if (video.currentTime >= rangeEnd - 0.04) {
      video.pause();
      video.currentTime = rangeEnd;
      if (!reachedRef.current) {
        reachedRef.current = true;
        onReachedEnd();
      }
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || phase !== "playing") return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden w-full",
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

      <div className="relative w-full bg-black">
        <video
          ref={videoRef}
          playsInline
          preload="auto"
          src={videoUrl}
          className="block w-full max-h-[55vh] md:max-h-[70vh] h-auto bg-black"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setUserPaused(false)}
          onPause={() => {
            if (phase === "playing") setUserPaused(true);
          }}
          onEnded={() => {
            if (phase === "playing" && !reachedRef.current) {
              reachedRef.current = true;
              onReachedEnd();
            }
          }}
        />

        {phase === "need_start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm bg-black/55 px-md">
            <Button type="button" onClick={onStart}>
              {startLabel}
            </Button>
          </div>
        )}

        {phase === "paused" && (
          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-md py-sm">
            <p className="font-label-sm text-[12px] text-white text-center">
              {pausedLabel}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-sm px-md py-sm">
        <p className="font-label-sm text-[12px] text-on-surface-variant">
          {phase === "playing" ? watchingLabel : pausedLabel}{" "}
          <span className="tabular-nums">
            {formatCueTime(rangeStart)} → {formatCueTime(rangeEnd)}
          </span>
        </p>
        {phase === "playing" && (
          <Button type="button" variant="ghost" size="sm" onClick={togglePlay}>
            <span className="material-symbols-outlined text-[18px]">
              {userPaused ? "play_arrow" : "pause"}
            </span>
            {userPaused ? playAria : pauseAria}
          </Button>
        )}
      </div>
    </div>
  );
}
