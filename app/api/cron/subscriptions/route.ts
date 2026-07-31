import { NextRequest } from "next/server";
import { expireEndedSubscriptions } from "@/lib/subscriptions/access";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

/**
 * Cron : expire les abonnements dont la période est terminée.
 * Protégé par CRON_SECRET (header Authorization: Bearer …).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");

  const authorized =
    (Boolean(secret) && auth === `Bearer ${secret}`) ||
    (!secret && process.env.NODE_ENV !== "production");

  if (!authorized) {
    return unauthorizedResponse();
  }

  const expired = await expireEndedSubscriptions();

  return successResponse({
    expired,
    at: new Date().toISOString(),
  });
}
