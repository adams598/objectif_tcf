import { prisma } from "@/lib/db/prisma";
import {
  getFromAddress,
  getFromAddressIssue,
  isEmailConfigured,
} from "@/lib/email/config";
import { formatResendError } from "@/lib/email/format-resend-error";
import { getResendClient } from "@/lib/email/resend-client";
import { buildInvoiceData } from "@/lib/invoices/build-invoice-data";
import { renderInvoiceHtml } from "@/lib/invoices/invoice-html";
import { generateInvoiceNumber } from "@/lib/invoices/invoice-number";
import type { PaymentInvoiceMetadata } from "@/lib/invoices/types";
import type { SendEmailResult } from "@/lib/email/send-verification-email";
import { generateInvoicePdfFromData } from "@/lib/pdf/generate-documents";

export async function getInvoicePayloadForPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      subscription: {
        select: {
          currentPeriodStart: true,
          currentPeriodEnd: true,
          examType: true,
          plan: true,
        },
      },
    },
  });

  if (!payment || payment.status !== "SUCCEEDED") {
    return null;
  }

  const invoice = buildInvoiceData({
    payment,
    user: payment.user,
    subscription: payment.subscription,
  });

  return {
    payment,
    invoice,
    html: renderInvoiceHtml(invoice),
    emailHtml: renderInvoiceHtml(invoice, { forEmail: true }),
  };
}

export async function sendInvoiceEmailForPayment(
  paymentId: string,
  options?: { force?: boolean }
): Promise<SendEmailResult> {
  const payload = await getInvoicePayloadForPayment(paymentId);
  if (!payload) {
    return { ok: false, error: "Paiement introuvable ou non confirmé" };
  }

  const { payment, invoice, emailHtml } = payload;
  const metadata = (payment.metadata ?? {}) as PaymentInvoiceMetadata;
  const invoiceNumber = generateInvoiceNumber(payment);

  if (metadata.invoiceSentAt && !options?.force) {
    return { ok: true };
  }

  if (!isEmailConfigured()) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY manquant — configurez Resend pour envoyer les factures.",
    };
  }

  // getFromAddress() bascule déjà sur onboarding@resend.dev si FROM invalide.
  // On journalise seulement (ne pas bloquer l'envoi).
  const fromIssue = getFromAddressIssue();
  if (fromIssue) {
    console.warn("[Invoice] RESEND_FROM_EMAIL invalide, fallback utilisé:", fromIssue);
  }

  try {
    const resend = getResendClient();
    const from = getFromAddress();
    const to = payment.user.email;
    const subject = `Votre facture ${invoiceNumber} — Objectif TCF`;

    let pdfBase64: string | null = null;
    try {
      const pdfBytes = await generateInvoicePdfFromData(invoice);
      pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    } catch (pdfErr) {
      console.error("[Invoice] PDF generation failed, envoi HTML seul:", pdfErr);
    }

    const { error: withPdfError } = await resend.emails.send({
      from,
      to,
      subject,
      html: emailHtml,
      ...(pdfBase64
        ? {
            attachments: [
              {
                filename: `${invoiceNumber}.pdf`,
                content: pdfBase64,
                contentType: "application/pdf",
              },
            ],
          }
        : {}),
    });

    if (withPdfError) {
      console.error("[Invoice] Email send failed:", withPdfError);
      const formatted = formatResendError(withPdfError);

      // Si la pièce jointe pose problème, retenter sans PDF
      if (pdfBase64 && !/only send testing emails to your own/i.test(withPdfError.message ?? "")) {
        const { error: htmlOnlyError } = await resend.emails.send({
          from,
          to,
          subject,
          html: emailHtml,
        });
        if (!htmlOnlyError) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              metadata: {
                ...metadata,
                invoiceNumber,
                invoiceSentAt: new Date().toISOString(),
                invoiceEmailPdfAttached: false,
              },
            },
          });
          return { ok: true };
        }
        console.error("[Invoice] HTML-only retry failed:", htmlOnlyError);
        return { ok: false, error: formatResendError(htmlOnlyError) };
      }

      return { ok: false, error: formatted };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...metadata,
          invoiceNumber,
          invoiceSentAt: new Date().toISOString(),
          invoiceEmailPdfAttached: Boolean(pdfBase64),
        },
      },
    });

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi de facture inconnue";
    console.error("[Invoice] Email error:", err);
    return { ok: false, error: message };
  }
}

export async function issueInvoiceForPayment(
  paymentId: string
): Promise<SendEmailResult> {
  return sendInvoiceEmailForPayment(paymentId);
}

export async function listUserInvoices(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { userId, status: "SUCCEEDED" },
    include: {
      subscription: {
        select: {
          currentPeriodStart: true,
          currentPeriodEnd: true,
          examType: true,
          plan: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  return payments.map((payment) => {
    const invoice = buildInvoiceData({
      payment,
      user: payment.user,
      subscription: payment.subscription,
    });

    return {
      paymentId: payment.id,
      invoiceNumber: invoice.invoiceNumber,
      paidAt: payment.paidAt?.toISOString() ?? payment.updatedAt.toISOString(),
      amount: payment.amount,
      currency: payment.currency,
      amountFormatted: invoice.amountFormatted,
      description: invoice.description,
      examTypeLabel: invoice.examTypeLabel,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      subscriptionDays: invoice.subscriptionDays,
      downloadPath: `/api/paiement/${payment.id}/facture`,
      pdfDownloadPath: `/api/paiement/${payment.id}/facture?format=pdf`,
      viewPath: `/api/paiement/${payment.id}/facture?inline=1`,
    };
  });
}
