import { NextRequest } from "next/server";
import type { PaymentStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import {
  getPaymentStatsForAdmin,
  listPaymentsForAdmin,
} from "@/lib/payments/service";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as PaymentStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const [result, stats] = await Promise.all([
      listPaymentsForAdmin({
        status: status ?? undefined,
        page,
        limit,
      }),
      getPaymentStatsForAdmin(),
    ]);

    return successResponse({
      payments: result.items,
      stats,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    return serverErrorResponse(error);
  }
}
