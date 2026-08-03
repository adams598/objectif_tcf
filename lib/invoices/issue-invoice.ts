import { prisma } from "@/lib/db/prisma";
import {
  getFromAddress,
  getFromAddressIssue,
  isEmailConfigured,
} from "@/lib/email/config";
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

  const fromIssue = getFromAddressIssue();
  if (fromIssue) {
    return { ok: false, error: fromIssue };
  }

  try {
    const pdfBytes = await generateInvoicePdfFromData(invoice);
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: payment.user.email,
      subject: `Votre facture ${invoiceNumber} — Objectif TCF`,
      html: emailHtml,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ],
    });

    if (error) {
      console.error("[Invoice] Email send failed:", error);
      const msg = error.message ?? "Échec d'envoi Resend";
      if (/only send testing emails to your own/i.test(msg)) {
        return {
          ok: false,
          error:
            `${msg} — Avec onboarding@resend.dev, la facture ne peut être envoyée ` +
            `qu’à l’email du compte Resend. Vérifiez un domaine ou utilisez cet email.`,
        };
      }
      return { ok: false, error: msg };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...metadata,
          invoiceNumber,
          invoiceSentAt: new Date().toISOString(),
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
