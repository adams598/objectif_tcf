import { NextRequest, NextResponse } from "next/server";
import {
  getLegalDocument,
  isPublicLegalSlug,
} from "@/lib/legal/documents";
import { generateLegalPdf } from "@/lib/pdf/generate-legal-pdf";
import {
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!isPublicLegalSlug(slug)) {
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
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
