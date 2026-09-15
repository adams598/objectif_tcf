"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminMediaUpload } from "@/modules/admin/components/admin-media-upload";
import { cn } from "@/lib/utils";
import { isEmbeddableVideoUrl } from "@/lib/media/video-upload";
import {
  MAX_QUESTIONS_PER_CUE,
  formatCueTime,
  parseCueTime,
  parseVideoCues,
  type SeriesVideoCue,
} from "@/lib/series/video-cues";

type QuestionOption = {
  id: string;
  order: number;
  content: string;
};

interface SeriesVideoCuesEditorProps {
  videoUrl: string;
  videoCues: unknown;
  questions: QuestionOption[];
  saving: boolean;
  onVideoUrlChange: (url: string) => void;
  onSaveCues: (cues: SeriesVideoCue[]) => void;
}

function newCueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cue_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function SeriesVideoCuesEditor({
  videoUrl,
  videoCues,
  questions,
  saving,
  onVideoUrlChange,
  onSaveCues,
}: SeriesVideoCuesEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cues, setCues] = useState<SeriesVideoCue[]>(() => parseVideoCues(videoCues));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setCues(parseVideoCues(videoCues));
  }, [videoCues, dirty]);

  const assignedIds = useMemo(() => new Set(cues.flatMap((c) => c.questionIds)), [cues]);
  const isEmbed = isEmbeddableVideoUrl(videoUrl);

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) ? video.duration : time;
    video.currentTime = Math.min(Math.max(0, time), Math.max(0, max));
  };

  const addCueAtCurrentTime = () => {
    const timeSec = Math.round(currentTime * 10) / 10;
    const tooClose = cues.some((cue) => Math.abs(cue.timeSec - timeSec) < 0.3);
    if (tooClose) {
      toast.error("Un arrêt existe déjà à cet instant (ou trop près).");
      return;
    }

    const nextQuestion = questions.find((q) => !assignedIds.has(q.id));
    const questionIds = nextQuestion ? [nextQuestion.id] : [];
    if (questionIds.length === 0) {
      toast.error("Assignez d'abord des questions, ou libérez-en une d'un autre arrêt.");
      return;
    }

    setCues((prev) =>
      [...prev, { id: newCueId(), timeSec, questionIds }].sort(
        (a, b) => a.timeSec - b.timeSec
      )
    );
    setDirty(true);
  };

  const updateCueTime = (cueId: string, raw: string) => {
    const parsed = parseCueTime(raw);
    if (parsed == null) return;
    setCues((prev) =>
      prev
        .map((cue) =>
          cue.id === cueId ? { ...cue, timeSec: Math.round(parsed * 10) / 10 } : cue
        )
        .sort((a, b) => a.timeSec - b.timeSec)
    );
    setDirty(true);
  };

  const toggleQuestion = (cueId: string, questionId: string) => {
    setCues((prev) =>
      prev.map((cue) => {
        if (cue.id !== cueId) {
          return {
            ...cue,
            questionIds: cue.questionIds.filter((id) => id !== questionId),
          };
        }
        if (cue.questionIds.includes(questionId)) {
          return {
            ...cue,
            questionIds: cue.questionIds.filter((id) => id !== questionId),
          };
        }
        if (cue.questionIds.length >= MAX_QUESTIONS_PER_CUE) {
          toast.error(`Maximum ${MAX_QUESTIONS_PER_CUE} questions par arrêt.`);
          return cue;
        }
        return { ...cue, questionIds: [...cue.questionIds, questionId] };
      })
    );
    setDirty(true);
  };

  const removeCue = (cueId: string) => {
    setCues((prev) => prev.filter((cue) => cue.id !== cueId));
    setDirty(true);
  };

  const handleSave = () => {
    const valid = cues.filter((cue) => cue.questionIds.length > 0);
    if (valid.length !== cues.length) {
      toast.error("Chaque arrêt doit être lié à au moins une question.");
      return;
    }
    setDirty(false);
    onSaveCues(valid);
  };

  return (
    <div className="flex flex-col gap-md rounded-xl border border-outline-variant bg-surface p-md">
      <div>
        <h4 className="font-label-md text-label-md font-bold">
          Vidéo de la compétence
        </h4>
        <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
          Une seule vidéo pour toute la section. Vous placez vous-même les pauses :
          1, 2 ou 3 questions maximum à chaque arrêt.
        </p>
      </div>

      <AdminMediaUpload
        kind="video"
        label="Fichier vidéo (MP4 recommandé)"
        value={videoUrl}
        onChange={onVideoUrlChange}
      />

      {!videoUrl ? null : isEmbed ? (
        <p className="font-label-sm text-[12px] text-error">
          Les points d’arrêt nécessitent un fichier vidéo (MP4, WebM…) et non un
          lien YouTube/Vimeo, afin de pouvoir reculer et marquer l’instant exact.
        </p>
      ) : (
        <>
          <div className="rounded-xl overflow-hidden border border-outline-variant bg-black">
            <video
              ref={videoRef}
              controls
              playsInline
              preload="metadata"
              src={videoUrl}
              className="block w-full max-h-[360px] bg-black"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                setDuration(e.currentTarget.duration || 0);
                setCurrentTime(e.currentTarget.currentTime);
              }}
              onSeeked={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-sm">
            <span className="font-label-sm text-label-sm font-semibold tabular-nums">
              {formatCueTime(currentTime)}
              {duration > 0 ? ` / ${formatCueTime(duration)}` : ""}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => seekTo(currentTime - 1)}
            >
              −1 s
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => seekTo(currentTime + 1)}
            >
              +1 s
            </Button>
            <Button type="button" size="sm" onClick={addCueAtCurrentTime}>
              <span className="material-symbols-outlined text-[18px]">flag</span>
              Ajouter un arrêt ici
            </Button>
          </div>

          {cues.length === 0 ? (
            <p className="font-label-sm text-[12px] text-on-surface-variant">
              Reculez ou avancez dans la vidéo, puis cliquez sur « Ajouter un arrêt
              ici ». Liez ensuite 1 à {MAX_QUESTIONS_PER_CUE} questions à cet instant.
            </p>
          ) : (
            <div className="flex flex-col gap-sm">
              {cues.map((cue, index) => (
                <div
                  key={cue.id}
                  className="rounded-xl border border-outline-variant bg-surface-container-low p-md flex flex-col gap-sm"
                >
                  <div className="flex flex-wrap items-center gap-sm">
                    <span className="font-label-sm font-bold text-primary">
                      Arrêt {index + 1}
                    </span>
                    <Input
                      className="w-28"
                      defaultValue={formatCueTime(cue.timeSec)}
                      key={`${cue.id}-${cue.timeSec}`}
                      onBlur={(e) => updateCueTime(cue.id, e.target.value)}
                      aria-label="Instant de pause"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => seekTo(cue.timeSec)}
                    >
                      Aller à cet instant
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCue(cue.id)}
                    >
                      <span className="material-symbols-outlined text-error text-[18px]">
                        delete
                      </span>
                    </Button>
                  </div>
                  <p className="font-label-sm text-[11px] text-on-surface-variant">
                    Questions à cet arrêt ({cue.questionIds.length}/
                    {MAX_QUESTIONS_PER_CUE})
                  </p>
                  <div className="flex flex-col gap-xs max-h-48 overflow-y-auto">
                    {questions.map((q) => {
                      const checked = cue.questionIds.includes(q.id);
                      const usedElsewhere =
                        !checked && assignedIds.has(q.id);
                      return (
                        <label
                          key={q.id}
                          className={cn(
                            "flex items-start gap-sm rounded-lg px-sm py-xs",
                            checked && "bg-primary/10",
                            usedElsewhere && "opacity-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={usedElsewhere}
                            onChange={() => toggleQuestion(cue.id, q.id)}
                            className="mt-1"
                          />
                          <span className="font-label-sm text-[12px] min-w-0">
                            <span className="font-bold">Q{q.order}</span>{" "}
                            <span className="text-on-surface-variant line-clamp-2">
                              {q.content || "Sans énoncé"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              {saving ? "Enregistrement…" : "Enregistrer les points d’arrêt"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
