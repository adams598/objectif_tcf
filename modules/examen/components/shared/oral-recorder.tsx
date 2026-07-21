"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";

interface OralRecorderProps {
  active: boolean;
  paused: boolean;
  maxSeconds?: number;
  onRecordingChange?: (blob: Blob | null, durationSec: number) => void;
}

export function OralRecorder({
  active,
  paused,
  maxSeconds = 600,
  onRecordingChange,
}: OralRecorderProps) {
  const { t } = useTranslation();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [duration, setDuration] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [permission, setPermission] = useState<
    "idle" | "granted" | "denied"
  >("idle");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const finalizeRecording = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    setPlaybackUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    onRecordingChange?.(blob, duration);
  }, [duration, onRecordingChange]);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRef.current?.state === "recording") {
        mediaRef.current.stop();
      }
      stopStream();
      return;
    }

    if (paused) {
      if (mediaRef.current?.state === "recording") {
        mediaRef.current.pause();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setPermission("granted");
        setMicError(null);

        const recorder = new MediaRecorder(stream);
        mediaRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = finalizeRecording;

        if (recorder.state === "inactive") {
          recorder.start(500);
        } else if (recorder.state === "paused") {
          recorder.resume();
        }

        timerRef.current = setInterval(() => {
          setDuration((d) => {
            const next = d + 1;
            if (next >= maxSeconds && mediaRef.current?.state === "recording") {
              mediaRef.current.stop();
            }
            return next;
          });
        }, 1000);
      } catch {
        setPermission("denied");
        setMicError(t("exam.micDenied"));
      }
    }

    if (mediaRef.current?.state === "paused") {
      mediaRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      void start();
    }

    return () => {
      cancelled = true;
    };
  }, [active, paused, maxSeconds, finalizeRecording, stopStream, t]);

  useEffect(() => {
    if (!active) {
      setDuration(0);
      chunksRef.current = [];
    }
  }, [active]);

  useEffect(() => {
    return () => {
      stopStream();
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopStream, playbackUrl]);

  const formatDur = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-md">
      {micError ? (
        <p className="font-label-sm text-label-sm text-error text-center max-w-sm">
          {micError}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-sm">
            <span
              className={cn(
                "w-3 h-3 rounded-full",
                active && !paused ? "bg-error animate-pulse" : "bg-outline-variant"
              )}
            />
            <span className="font-label-md text-label-md tabular-nums text-on-surface">
              {formatDur(duration)}
            </span>
          </div>

          {playbackUrl && !active && (
            <div className="w-full max-w-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs text-center">
                {t("exam.yourRecording")}
              </p>
              <audio controls src={playbackUrl} className="w-full" />
            </div>
          )}

          {permission === "granted" && active && !paused && (
            <p className="font-label-sm text-label-sm text-success">
              {t("exam.recordingInProgress")}
            </p>
          )}
        </>
      )}

      {permission === "denied" && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
        >
          {t("exam.retryAfterPermission")}
        </Button>
      )}
    </div>
  );
}
