import { createHash } from "crypto";
import type { AnalyticsEventType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveAppUrl } from "@/lib/env/app-url";
import {
  classifyAnalyticsPath,
  isTrackablePath,
  normalizeAnalyticsPath,
} from "@/lib/analytics/paths";

const DEDUP_MS = 30_000;
const UTM_MAX = 80;
const UTM_RE = /^[a-zA-Z0-9._\- ]{1,80}$/;
const SESSION_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pagespeed|pingdom|gtmetrix/i;

export type CollectPayload = {
  path?: unknown;
  referrer?: unknown;
  sessionId?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
};

function sanitizeUtm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, UTM_MAX);
  if (!trimmed || !UTM_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function sanitizeSessionId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return SESSION_RE.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function isLikelyBot(userAgent: string): boolean {
  return !userAgent || BOT_RE.test(userAgent);
}

export function parseDevice(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|webos/.test(ua)) return "mobile";
  if (/android/.test(ua)) return "tablet";
  return "desktop";
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  return forwarded || "0.0.0.0";
}

export function countryFromHeaders(headers: Headers): string | null {
  const code = (
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    ""
  )
    .trim()
    .toUpperCase();
  if (!code || code === "XX" || code.length !== 2) return null;
  return code;
}

export function dailyVisitorHash(ip: string, userAgent: string, at = new Date()): string {
  const day = at.toISOString().slice(0, 10);
  const secret = process.env.JWT_SECRET?.trim() || "objectif-tcf-analytics";
  return createHash("sha256")
    .update(`${day}|${ip}|${userAgent}|${secret}`)
    .digest("hex")
    .slice(0, 32);
}

function ownHostnames(): Set<string> {
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);
  try {
    hosts.add(new URL(resolveAppUrl()).hostname.toLowerCase());
  } catch {
    // ignore
  }
  return hosts;
}

export function sanitizeReferrer(raw: unknown, requestHost?: string | null): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase();
    if (!host) return null;
    const own = ownHostnames();
    if (requestHost) own.add(requestHost.toLowerCase().split(":")[0] ?? "");
    if (own.has(host)) return null;
    if (host.endsWith(".vercel.app") && [...own].some((h) => h.endsWith(".vercel.app"))) {
      return null;
    }
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

export async function recordPageView(
  payload: CollectPayload,
  headers: Headers
): Promise<void> {
  const userAgent = headers.get("user-agent") ?? "";
  if (isLikelyBot(userAgent)) return;

  const path = normalizeAnalyticsPath(
    typeof payload.path === "string" ? payload.path : ""
  );
  if (!path || !isTrackablePath(path)) return;

  const ip = clientIpFromHeaders(headers);
  const visitorHash = dailyVisitorHash(ip, userAgent);
  const sessionId = sanitizeSessionId(payload.sessionId) ?? visitorHash;
  const type = classifyAnalyticsPath(path) as AnalyticsEventType;

  const recent = await prisma.analyticsEvent.findFirst({
    where: {
      visitorHash,
      path,
      createdAt: { gte: new Date(Date.now() - DEDUP_MS) },
    },
    select: { id: true },
  });
  if (recent) return;

  await prisma.analyticsEvent.create({
    data: {
      type,
      path,
      referrer: sanitizeReferrer(payload.referrer, headers.get("host")),
      utmSource: sanitizeUtm(payload.utmSource),
      utmMedium: sanitizeUtm(payload.utmMedium),
      utmCampaign: sanitizeUtm(payload.utmCampaign),
      country: countryFromHeaders(headers),
      device: parseDevice(userAgent),
      visitorHash,
      sessionId,
    },
  });
}
