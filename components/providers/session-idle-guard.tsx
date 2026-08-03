"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const IDLE_MS = 15 * 60 * 1000;
const WARN_BEFORE_MS = 5 * 1000;
const REFRESH_WHILE_ACTIVE_MS = 10 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;

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
 * Garde la session ouverte tant que l’utilisateur est actif.
 * Après 15 min d’inactivité → déconnexion (toast discret 5 s avant).
 */
export function SessionIdleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const lastRefreshRef = useRef(0);
  const warnShownRef = useRef(false);
  const loggingOutRef = useRef(false);
  const hasSessionRef = useRef(false);

  useEffect(() => {
    if (isPublicAuthPath(pathname)) return;

    let cancelled = false;

    const markActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      warnShownRef.current = false;
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
      "visibilitychange",
    ];

    for (const event of events) {
      window.addEventListener(event, markActivity, { passive: true });
    }

    const tick = async () => {
      if (cancelled || loggingOutRef.current || !hasSessionRef.current) return;
      if (document.visibilityState === "hidden") return;

      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= IDLE_MS) {
        loggingOutRef.current = true;
        toast.dismiss("session-idle-warn");
        await logoutQuietly();
        router.replace("/connexion");
        return;
      }

      if (idleFor >= IDLE_MS - WARN_BEFORE_MS && !warnShownRef.current) {
        warnShownRef.current = true;
        toast("La session sera fermée dans quelques secondes…", {
          id: "session-idle-warn",
          duration: 5000,
          position: "bottom-right",
          className:
            "!bg-surface-container !text-on-surface-variant !border-outline-variant/60 !shadow-sm !text-sm !py-2 !px-3",
        });
      }

      // Renouvelle le JWT tant que l’utilisateur est actif
      if (
        idleFor < 60_000 &&
        Date.now() - lastRefreshRef.current > REFRESH_WHILE_ACTIVE_MS
      ) {
        lastRefreshRef.current = Date.now();
        const ok = await refreshSession();
        if (!ok) hasSessionRef.current = false;
      }
    };

    // Premier refresh : active la garde seulement si une session existe
    void (async () => {
      const ok = await refreshSession();
      if (cancelled) return;
      hasSessionRef.current = ok;
      if (ok) lastRefreshRef.current = Date.now();
    })();

    const interval = window.setInterval(() => {
      void tick();
    }, 1000);

    return () => {
      cancelled = true;
      for (const event of events) {
        window.removeEventListener(event, markActivity);
      }
      window.clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
