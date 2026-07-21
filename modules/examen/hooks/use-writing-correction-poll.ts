"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { WritingCorrectionPollResponse } from "@/lib/ai/writing-correction-types";
import type { WritingCorrectionResult } from "@/lib/ai/writing-correction-types";

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 30;

export function useWritingCorrectionPoll(token?: string) {
  const [status, setStatus] = useState<
    "idle" | "pending" | "processing" | "completed" | "failed"
  >("idle");
  const [result, setResult] = useState<WritingCorrectionResult | null>(null);
  const [resultSource, setResultSource] = useState<string | null>(null);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!token) {
      setStatus("idle");
      return;
    }

    pollsRef.current = 0;
    setStatus("pending");
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (cancelled) return;

      try {
        const data = await fetchJson<WritingCorrectionPollResponse>(
          `/api/corrections/writing/${token}`
        );

        if (data.status === "PROCESSING") setStatus("processing");
        else if (data.status === "PENDING") setStatus("pending");

        if (data.status === "COMPLETED" && data.result) {
          setResult(data.result);
          setResultSource(data.resultSource ?? data.result.source);
          setStatus("completed");
          return;
        }

        if (data.status === "FAILED") {
          setStatus("failed");
          return;
        }

        pollsRef.current += 1;
        if (pollsRef.current < MAX_POLLS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          setStatus("failed");
        }
      } catch {
        pollsRef.current += 1;
        if (pollsRef.current < MAX_POLLS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          setStatus("failed");
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  return { status, result, resultSource };
}
