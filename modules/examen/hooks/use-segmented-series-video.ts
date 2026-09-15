"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  canUseNativeVideoCues,
  cueIndexForQuestion,
  questionIndicesForCue,
  sanitizeVideoCues,
  segmentRange,
  type SeriesVideoCue,
} from "@/lib/series/video-cues";

export type SegmentedPhase = "need_start" | "playing" | "paused";

type QuestionLike = { id: string };

export function useSegmentedSeriesVideo(options: {
  videoUrl: string | null | undefined;
  videoCues: unknown;
  questions: QuestionLike[];
  currentIndex: number;
  hydrated: boolean;
  resumeIndex: number;
}) {
  const { videoUrl, videoCues, questions, currentIndex, hydrated, resumeIndex } =
    options;

  const cues = useMemo(() => {
    const allowed = new Set(questions.map((q) => q.id));
    return sanitizeVideoCues(videoCues, allowed);
  }, [videoCues, questions]);

  const enabled = Boolean(
    videoUrl && canUseNativeVideoCues(videoUrl) && cues.length > 0 && questions.length > 0
  );

  const [phase, setPhase] = useState<SegmentedPhase>("need_start");
  const [segmentCueIndex, setSegmentCueIndex] = useState(0);
  const [reachedCueIndex, setReachedCueIndex] = useState(-1);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!hydrated || !enabled) {
      setInitialized(false);
      setPhase("need_start");
      setSegmentCueIndex(0);
      setReachedCueIndex(-1);
      return;
    }
    if (initialized) return;

    const resumeCue = cueIndexForQuestion(
      cues,
      questions[resumeIndex]?.id ?? questions[0]?.id ?? ""
    );
    if (resumeCue >= 0 && resumeIndex > 0) {
      setPhase("paused");
      setSegmentCueIndex(resumeCue);
      setReachedCueIndex(resumeCue);
    } else {
      setPhase("need_start");
      setSegmentCueIndex(0);
      setReachedCueIndex(-1);
    }
    setInitialized(true);
  }, [hydrated, enabled, initialized, cues, questions, resumeIndex]);

  const range = enabled
    ? segmentRange(cues, Math.max(0, segmentCueIndex))
    : { start: 0, end: 0 };

  const currentCueIndex = enabled
    ? cueIndexForQuestion(cues, questions[currentIndex]?.id ?? "")
    : -1;

  const showQuestions =
    !enabled ||
    (phase === "paused" &&
      (currentCueIndex >= 0
        ? currentCueIndex <= reachedCueIndex
        : reachedCueIndex >= cues.length - 1));

  const canSelectIndex = useCallback(
    (index: number) => {
      if (!enabled) return true;
      const cueIdx = cueIndexForQuestion(cues, questions[index]?.id ?? "");
      if (cueIdx < 0) return reachedCueIndex >= cues.length - 1;
      return cueIdx <= reachedCueIndex;
    },
    [enabled, cues, questions, reachedCueIndex]
  );

  const startPlayback = useCallback(() => {
    setPhase("playing");
    setSegmentCueIndex(0);
  }, []);

  const handleReachedSegmentEnd = useCallback(() => {
    const cueIdx = segmentCueIndex;
    setPhase("paused");
    setReachedCueIndex((prev) => Math.max(prev, cueIdx));
    const indices = questionIndicesForCue(cues, cueIdx, questions);
    return indices[0] ?? currentIndex;
  }, [segmentCueIndex, cues, questions, currentIndex]);

  const handleNext = useCallback(():
    | { type: "blocked" }
    | { type: "advance"; index: number }
    | { type: "play_next_segment" }
    | { type: "finish" } => {
    if (!enabled) {
      if (currentIndex < questions.length - 1) {
        return { type: "advance", index: currentIndex + 1 };
      }
      return { type: "finish" };
    }

    if (phase !== "paused") return { type: "blocked" };

    const cueIdx = cueIndexForQuestion(
      cues,
      questions[currentIndex]?.id ?? ""
    );

    if (cueIdx >= 0) {
      const indices = questionIndicesForCue(cues, cueIdx, questions);
      const pos = indices.indexOf(currentIndex);
      if (pos >= 0 && pos < indices.length - 1) {
        return { type: "advance", index: indices[pos + 1] };
      }
      if (cueIdx < cues.length - 1) {
        setPhase("playing");
        setSegmentCueIndex(cueIdx + 1);
        return { type: "play_next_segment" };
      }
    }

    const nextUnassigned = questions.findIndex((q, i) => {
      if (i <= currentIndex) return false;
      return cueIndexForQuestion(cues, q.id) < 0;
    });
    if (nextUnassigned >= 0) {
      return { type: "advance", index: nextUnassigned };
    }
    if (currentIndex < questions.length - 1) {
      return { type: "advance", index: currentIndex + 1 };
    }
    return { type: "finish" };
  }, [enabled, phase, cues, questions, currentIndex]);

  const handlePrev = useCallback((): number => {
    let next = Math.max(0, currentIndex - 1);
    while (next > 0 && !canSelectIndex(next)) next -= 1;
    if (enabled) {
      const cueIdx = cueIndexForQuestion(cues, questions[next]?.id ?? "");
      if (cueIdx >= 0) {
        setPhase("paused");
        setSegmentCueIndex(cueIdx);
      }
    }
    return next;
  }, [currentIndex, canSelectIndex, enabled, cues, questions]);

  return {
    enabled,
    cues,
    phase,
    rangeStart: range.start,
    rangeEnd: range.end,
    showQuestions,
    canGoNext: !enabled || phase === "paused",
    canGoPrev: currentIndex > 0 && canSelectIndex(Math.max(0, currentIndex - 1)),
    canSelectIndex,
    startPlayback,
    handleReachedSegmentEnd,
    handleNext,
    handlePrev,
  };
}

export type { SeriesVideoCue };
