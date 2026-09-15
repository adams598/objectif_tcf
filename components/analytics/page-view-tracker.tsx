"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isTrackablePath, normalizeAnalyticsPath } from "@/lib/analytics/paths";

const SESSION_KEY = "ot-analytics-sid";
const UTM_KEY = "ot-analytics-utm";
const REF_KEY = "ot-analytics-ref";
const LAST_KEY = "ot-analytics-last";
const DEDUP_MS = 2000;

type StoredUtm = {
  source?: string;
  medium?: string;
  campaign?: string;
};

function isPrivacyRestricted(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & {
    globalPrivacyControl?: boolean;
    msDoNotTrack?: string;
  };
  if (nav.globalPrivacyControl) return true;
  const w = window as Window & { doNotTrack?: string };
  const dnt = nav.doNotTrack || nav.msDoNotTrack || w.doNotTrack;
  return dnt === "1" || dnt === "yes";
}

function readSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function captureUtms(): StoredUtm {
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored) as StoredUtm;
  } catch {
    // ignore
  }

  const params = new URLSearchParams(window.location.search);
  const utm: StoredUtm = {
    source: params.get("utm_source")?.trim() || undefined,
    medium: params.get("utm_medium")?.trim() || undefined,
    campaign: params.get("utm_campaign")?.trim() || undefined,
  };

  if (utm.source || utm.medium || utm.campaign) {
    try {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    } catch {
      // ignore
    }
  }

  return utm;
}

function captureReferrer(): string | undefined {
  try {
    const stored = sessionStorage.getItem(REF_KEY);
    if (stored !== null) return stored || undefined;
  } catch {
    // ignore
  }

  const referrer = document.referrer || "";
  try {
    sessionStorage.setItem(REF_KEY, referrer);
  } catch {
    // ignore
  }
  return referrer || undefined;
}

function recentlySent(path: string): boolean {
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    if (!raw) return false;
    const [lastPath, lastAt] = raw.split("|");
    if (lastPath !== path) return false;
    return Date.now() - Number(lastAt) < DEDUP_MS;
  } catch {
    return false;
  }
}

function markSent(path: string) {
  try {
    sessionStorage.setItem(LAST_KEY, `${path}|${Date.now()}`);
  } catch {
    // ignore
  }
}

function sendPageView(path: string) {
  if (recentlySent(path)) return;
  markSent(path);

  const utm = captureUtms();
  const body = JSON.stringify({
    path,
    referrer: captureReferrer(),
    sessionId: readSessionId(),
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmCampaign: utm.campaign,
  });

  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    // Le tracking ne doit jamais casser la page
  });
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (isPrivacyRestricted()) return;

    const path = normalizeAnalyticsPath(pathname);
    if (!path || !isTrackablePath(path)) return;
    if (lastPath.current === path) return;
    lastPath.current = path;

    sendPageView(path);
  }, [pathname]);

  return null;
}
