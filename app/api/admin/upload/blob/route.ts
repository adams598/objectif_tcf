import { requireRole } from "@/lib/auth/session";
import { handleAdminBlobClientUpload } from "@/lib/media/handle-admin-blob-upload";
import {
  forbiddenResponse,
  serverErrorResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/utils/api-response";

/**
 * Token JSON pour upload client → Vercel Blob.
 * Le fichier ne transite jamais par cette route (évite le 413 Vercel ~4,5 Mo).
 */
export async function POST(request: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    return await handleAdminBlobClientUpload(request);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    if (error instanceof Error && error.message.includes("Chemin")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error);
  }
}
