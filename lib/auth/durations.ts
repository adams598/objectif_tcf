/** Durées de session — une seule source pour JWT, cookies et garde d'inactivité. */

export const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN?.trim() || "20m";
export const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "7d";

/** Déconnexion seulement après 20 min sans interaction. */
export const INACTIVITY_LOGOUT_MS = 20 * 60 * 1000;
export const IDLE_WARN_BEFORE_MS = 60 * 1000;
/** Renouvelle le JWT toutes les 4 min tant que la session n'est pas idle. */
export const REFRESH_WHILE_ACTIVE_MS = 4 * 60 * 1000;

export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? 0);
}

export const ACCESS_TOKEN_MAX_AGE_SEC = Math.floor(
  parseDuration(ACCESS_TOKEN_TTL) / 1000
);
export const REFRESH_TOKEN_MAX_AGE_SEC = Math.floor(
  parseDuration(REFRESH_TOKEN_TTL) / 1000
);
