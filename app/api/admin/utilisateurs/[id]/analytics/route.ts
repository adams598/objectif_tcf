import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { fetchAdminUserAnalytics } from "@/lib/admin/user-analytics";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const data = await fetchAdminUserAnalytics(id);
    if (!data) return notFoundResponse("Utilisateur");
    return successResponse(data);
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
