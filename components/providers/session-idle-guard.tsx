"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/** Déconnexion après 10 minutes sans interaction utilisateur. */
const INACTIVITY_LOGOUT_MS = 10 * 60 * 1000;
const WARN_BEFORE_MS = 5 * 1000;
const REFRESH_WHILE_ACTIVE_MS = 5 * 60 * 1000;
const RECENT_ACTIVITY_MS = 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;
const TICK_INTERVAL_MS = 1000;

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
 * Garde la session ouverte tant que l'utilisateur interagit avec l'app.
 * Après 10 min d'inactivité (sans souris, clavier, scroll, touch) → déconnexion.
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

    const windowEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ];

    for (const event of windowEvents) {
      window.addEventListener(event, markActivity, { passive: true });
    }

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
        idleFor >= INACTIVITY_LOGOUT_MS - WARN_BEFORE_MS &&
        !warnShownRef.current
      ) {
        warnShownRef.current = true;
        toast("La session sera fermée dans quelques secondes…", {
          id: "session-idle-warn",
          duration: 5000,
          position: "bottom-right",
          className:
            "!bg-surface-container !text-on-surface-variant !border-outline-variant/60 !shadow-sm !text-sm !py-2 !px-3",
        });
      }

      // Renouvelle le JWT tant que l'utilisateur est actif (onglet visible)
      if (
        document.visibilityState === "visible" &&
        idleFor < RECENT_ACTIVITY_MS &&
        Date.now() - lastRefreshRef.current > REFRESH_WHILE_ACTIVE_MS
      ) {
        lastRefreshRef.current = Date.now();
        const ok = await refreshSession();
        if (!ok) hasSessionRef.current = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    void (async () => {
      const ok = await refreshSession();
      if (cancelled) return;
      hasSessionRef.current = ok;
      if (ok) {
        lastRefreshRef.current = Date.now();
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
