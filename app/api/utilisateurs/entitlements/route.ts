import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getActiveExamEntitlements } from "@/lib/subscriptions/access";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const entitlements = await getActiveExamEntitlements(user.userId);

    return successResponse({ entitlements });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
