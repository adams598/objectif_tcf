import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getInvoicePayloadForPayment } from "@/lib/invoices/issue-invoice";
import { generateInvoicePdfFromData } from "@/lib/pdf/generate-documents";
import {
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const format = new URL(req.url).searchParams.get("format");
    const inline = new URL(req.url).searchParams.get("inline") === "1";

    const payload = await getInvoicePayloadForPayment(id);
    if (!payload || payload.payment.userId !== user.userId) {
      return notFoundResponse("Facture");
    }

    if (format === "pdf") {
      const pdfBytes = await generateInvoicePdfFromData(payload.invoice);

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${payload.invoice.invoiceNumber}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const filename = `${payload.invoice.invoiceNumber}.html`;
    const disposition = inline ? "inline" : "attachment";

    return new NextResponse(payload.html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
