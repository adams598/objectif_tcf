import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getInvoicePayloadForPayment } from "@/lib/invoices/issue-invoice";
import { generateInvoicePdf } from "@/lib/pdf/generate-documents";
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

    const payload = await getInvoicePayloadForPayment(id);
    if (!payload || payload.payment.userId !== user.userId) {
      return notFoundResponse("Facture");
    }

    if (format === "pdf") {
      const pdfBytes = await generateInvoicePdf({
        invoiceNumber: payload.invoice.invoiceNumber,
        customerName: payload.invoice.customerName,
        customerEmail: payload.invoice.customerEmail,
        description: payload.invoice.description,
        examTypeLabel: payload.invoice.examTypeLabel,
        amountLabel: payload.invoice.amountFormatted,
        paidAt: payload.invoice.paidAt,
        periodEnd: payload.invoice.periodEnd,
      });

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

    return new NextResponse(payload.html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
