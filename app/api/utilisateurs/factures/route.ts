import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { listUserInvoices } from "@/lib/invoices/issue-invoice";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const invoices = await listUserInvoices(user.userId);
    return successResponse({ invoices });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
