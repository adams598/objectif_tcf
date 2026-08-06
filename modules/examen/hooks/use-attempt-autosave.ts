"use client";

import { useCallback, useEffect, useRef } from "react";
import { fetchJson } from "@/lib/api/fetch-json";

export interface AttemptProgressPayload {
  answers?: Record<string, string>;
  textResponses?: Record<string, string>;
  currentOrder?: number;
  elapsedSec?: number;
}

interface UseAttemptAutosaveOptions {
  /** Identifiant de la tentative IN_PROGRESS à hydrater/sauvegarder. */
  attemptId: string | null | undefined;
  /** Payload courant côté client (recalculé à chaque changement pertinent). */
  payload: AttemptProgressPayload;
  /** Délai de debounce en ms. */
  debounceMs?: number;
  /** Désactive complètement l'auto-save (mode invité, série non chargée…). */
  enabled?: boolean;
}

/**
 * Sauvegarde progressivement l'état d'une tentative sur le serveur pour
 * permettre à l'utilisateur de reprendre où il en était après une déconnexion,
 * une fermeture d'onglet ou un rafraîchissement.
 *
 * - Debounce configurable pour limiter les requêtes.
 * - Flush automatique sur `pagehide` / `beforeunload` (fermeture / navigation).
 * - `flush()` exposé pour forcer une sauvegarde (ex. juste avant soumission).
 */
export function useAttemptAutosave({
  attemptId,
  payload,
  debounceMs = 700,
  enabled = true,
}: UseAttemptAutosaveOptions) {
  const latestPayload = useRef<AttemptProgressPayload>(payload);
  const inFlight = useRef<Promise<unknown> | null>(null);
  const pending = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabled = !enabled || !attemptId;

  useEffect(() => {
    latestPayload.current = payload;
  }, [payload]);

  const send = useCallback(async () => {
    if (disabled) return;
    if (inFlight.current) {
      pending.current = true;
      return;
    }
    const body = latestPayload.current;
    inFlight.current = fetchJson(`/api/tentatives/${attemptId}/progress`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
      .catch((err) => {
        console.warn("[attempt-autosave] save failed", err);
      })
      .finally(() => {
        inFlight.current = null;
        if (pending.current) {
          pending.current = false;
          void send();
        }
      });
  }, [attemptId, disabled]);

  const scheduleSave = useCallback(() => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void send();
    }, debounceMs);
  }, [disabled, debounceMs, send]);

  // Déclenche un enregistrement debouncé chaque fois que le payload change.
  useEffect(() => {
    if (disabled) return;
    scheduleSave();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [payload, disabled, scheduleSave]);

  const flush = useCallback(() => {
    if (disabled) return Promise.resolve();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void send();
    return inFlight.current ?? Promise.resolve();
  }, [disabled, send]);

  // Sauvegarde de dernier recours à la fermeture / navigation.
  useEffect(() => {
    if (disabled) return;
    const flushBeacon = () => {
      try {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(latestPayload.current)], {
            type: "application/json",
          });
          navigator.sendBeacon(`/api/tentatives/${attemptId}/progress`, blob);
          return;
        }
      } catch {
        // fallback fetch keepalive
      }
      try {
        void fetch(`/api/tentatives/${attemptId}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latestPayload.current),
          keepalive: true,
        });
      } catch {
        // ignore
      }
    };

    const handleBeforeUnload = () => flushBeacon();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushBeacon();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [attemptId, disabled]);

  return { flush };
}
