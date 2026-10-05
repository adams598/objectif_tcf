"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IDLE_WARN_BEFORE_MS,
  INACTIVITY_LOGOUT_MS,
  REFRESH_WHILE_ACTIVE_MS,
} from "@/lib/auth/durations";

const ACTIVITY_THROTTLE_MS = 1000;
const TICK_INTERVAL_MS = 5000;

const AUTH_PATH_PREFIXES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe",
  "/verification-email",
];

function isPublicAuthPath(pathname: string) {
  return AUTH_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

async function logoutQuietly() {
  try {
    await fetch("/api/auth/deconnexion", { method: "POST" });
  } catch {
    /* ignore */
  }
}

/**
 * Garde la session ouverte tant que l'onglet est utilisé.
 * Déconnexion seulement après 20 min sans souris, clavier, scroll ni focus.
 */
export function SessionIdleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const lastRefreshRef = useRef(0);
  const warnShownRef = useRef(false);
  const loggingOutRef = useRef(false);
  const hasSessionRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    if (isPublicAuthPath(pathname)) return;

    let cancelled = false;

    const markActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      warnShownRef.current = false;
    };

    const windowEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
      "focus",
    ];

    for (const event of windowEvents) {
      window.addEventListener(event, markActivity, { passive: true });
    }

    const tryRefresh = async () => {
      if (refreshInFlightRef.current) return true;
      refreshInFlightRef.current = true;
      try {
        const ok = await refreshSession();
        if (ok) {
          lastRefreshRef.current = Date.now();
          hasSessionRef.current = true;
        }
        return ok;
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    const tick = async () => {
      if (cancelled || loggingOutRef.current || !hasSessionRef.current) return;

      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= INACTIVITY_LOGOUT_MS) {
        loggingOutRef.current = true;
        toast.dismiss("session-idle-warn");
        await logoutQuietly();
        router.replace("/connexion");
        return;
      }

      if (
        idleFor >= INACTIVITY_LOGOUT_MS - IDLE_WARN_BEFORE_MS &&
        !warnShownRef.current
      ) {
        warnShownRef.current = true;
        toast("La session sera fermée dans 1 minute pour inactivité…", {
          id: "session-idle-warn",
          duration: 8000,
          position: "bottom-right",
          className:
            "!bg-surface-container !text-on-surface-variant !border-outline-variant/60 !shadow-sm !text-sm !py-2 !px-3",
        });
      }

      if (
        document.visibilityState === "visible" &&
        idleFor < INACTIVITY_LOGOUT_MS &&
        Date.now() - lastRefreshRef.current > REFRESH_WHILE_ACTIVE_MS
      ) {
        await tryRefresh();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity();
        void tick();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    void (async () => {
      const ok = await tryRefresh();
      if (cancelled) return;
      hasSessionRef.current = ok;
      if (ok) {
        lastActivityRef.current = Date.now();
      }
    })();

    const interval = window.setInterval(() => {
      void tick();
    }, TICK_INTERVAL_MS);

    return () => {
      cancelled = true;
      for (const event of windowEvents) {
        window.removeEventListener(event, markActivity);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
