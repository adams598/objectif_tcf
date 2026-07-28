import { NextRequest } from "next/server";
import type { ExamType } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { fetchAdminAnalytics } from "@/lib/admin/analytics";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const EXAM_TYPES = [
  "TCF_CANADA",
  "TEF_CANADA",
  "IELTS",
  "DELF",
  "DALF",
  "TOEFL",
  "AUTRE",
] as const;

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const examTypeRaw = searchParams.get("examType");
    const monthsRaw = searchParams.get("months");

    const examType =
      examTypeRaw && EXAM_TYPES.includes(examTypeRaw as (typeof EXAM_TYPES)[number])
        ? (examTypeRaw as ExamType)
        : null;

    const months = monthsRaw ? Math.min(24, Math.max(1, parseInt(monthsRaw, 10) || 6)) : 6;

    const data = await fetchAdminAnalytics({ examType, months });
    return successResponse(data);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
