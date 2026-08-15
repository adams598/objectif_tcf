import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  getLegalDocument,
  isLegalDocumentSlug,
} from "@/lib/legal/documents";
import { generateLegalPdf } from "@/lib/pdf/generate-legal-pdf";
import {
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const { slug } = await params;
    if (!isLegalDocumentSlug(slug)) {
      return notFoundResponse("Document");
    }

    const { meta, content, issuer } = getLegalDocument(slug);
    const pdfBytes = await generateLegalPdf(content, issuer);
    const inline = new URL(req.url).searchParams.get("inline") === "1";

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${meta.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
