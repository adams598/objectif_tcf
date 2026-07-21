"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ExamAudioPlayerProps {
  audioUrl?: string | null;
  audioScript?: string | null;
  label?: string;
  className?: string;
  autoPlay?: boolean;
}

export function ExamAudioPlayer({
  audioUrl,
  audioScript,
  label,
  className,
  autoPlay = false,
}: ExamAudioPlayerProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t("exam.audioDocument");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "playing" | "error"
  >("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    audioUrl ?? null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasSource = Boolean(audioUrl || audioScript?.trim());

  const loadTts = useCallback(async () => {
    if (!audioScript?.trim()) return null;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/media/tts?text=${encodeURIComponent(audioScript.trim())}`
      );
      if (!res.ok) throw new Error(t("exam.ttsUnavailable"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      return url;
    } catch {
      setStatus("error");
      setErrorMsg(t("exam.audioUnavailableBrowser"));
      return null;
    }
  }, [audioScript, t]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function resolve() {
      if (audioUrl) {
        setResolvedUrl(audioUrl);
        setStatus("ready");
        return;
      }
      if (audioScript?.trim()) {
        const url = await loadTts();
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        if (url) {
          objectUrl = url;
          setResolvedUrl(url);
          setStatus("ready");
        }
      } else {
        setStatus("idle");
      }
    }

    void resolve();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [audioUrl, audioScript, loadTts]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !resolvedUrl) return;

    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => setStatus("ready");
    const onPlay = () => setStatus("playing");
    const onPause = () => setStatus("ready");

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    el.load();

    if (autoPlay && resolvedUrl) {
      void el.play().catch(() => undefined);
    }

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [resolvedUrl, autoPlay]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !resolvedUrl) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const speakWithBrowser = () => {
    if (!audioScript?.trim() || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(audioScript.trim());
    utter.lang = "fr-CA";
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.find((v) => v.lang.startsWith("fr"));
    if (fr) utter.voice = fr;
    window.speechSynthesis.speak(utter);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("rounded-xl bg-surface-container-low p-md", className)}>
      <div className="flex items-center gap-sm mb-sm">
        <span className="material-symbols-outlined text-primary text-[22px]">
          volume_up
        </span>
        <span className="font-label-md text-label-md font-bold text-on-surface">
          {displayLabel}
        </span>
        {status === "loading" && (
          <span className="font-label-sm text-label-sm text-on-surface-variant ml-auto">
            {t("exam.loadingAudio")}
          </span>
        )}
      </div>

      {resolvedUrl ? (
        <>
          <audio ref={audioRef} src={resolvedUrl} preload="auto" className="hidden" />
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={togglePlay}
              disabled={status === "loading"}
              className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md hover:opacity-90 disabled:opacity-50"
              aria-label={
                status === "playing" ? t("exam.pauseAria") : t("exam.playAria")
              }
            >
              <span className="material-symbols-outlined text-[24px]">
                {status === "playing" ? "pause" : "play_arrow"}
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-outline-variant/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-xs font-label-sm text-label-sm text-on-surface-variant tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {!hasSource
            ? t("exam.noAudioDocument")
            : status === "loading"
              ? t("exam.generatingAudio")
              : t("exam.preparingAudio")}
        </p>
      )}

      {errorMsg && (
        <div className="mt-sm flex flex-col sm:flex-row gap-sm items-start sm:items-center">
          <p className="font-label-sm text-label-sm text-error flex-1">{errorMsg}</p>
          <Button type="button" variant="secondary" size="sm" onClick={speakWithBrowser}>
            {t("exam.readAloud")}
          </Button>
        </div>
      )}
    </div>
  );
}
