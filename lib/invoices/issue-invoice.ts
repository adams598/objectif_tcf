import { prisma } from "@/lib/db/prisma";
import { getFromAddress, isEmailConfigured } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/resend-client";
import { buildInvoiceData } from "@/lib/invoices/build-invoice-data";
import { renderInvoiceHtml } from "@/lib/invoices/invoice-html";
import { generateInvoiceNumber } from "@/lib/invoices/invoice-number";
import type { PaymentInvoiceMetadata } from "@/lib/invoices/types";
import type { SendEmailResult } from "@/lib/email/send-verification-email";

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

export async function issueInvoiceForPayment(
  paymentId: string
): Promise<SendEmailResult> {
  const payload = await getInvoicePayloadForPayment(paymentId);
  if (!payload) {
    return { ok: false, error: "Paiement introuvable ou non confirmé" };
  }

  const { payment, invoice, emailHtml } = payload;
  const metadata = (payment.metadata ?? {}) as PaymentInvoiceMetadata;
  const invoiceNumber = generateInvoiceNumber(payment);

  if (metadata.invoiceSentAt) {
    return { ok: true };
  }

  if (!isEmailConfigured()) {
    console.log(
      `[DEV] Invoice ${invoiceNumber} for ${payment.user.email}: ${invoice.downloadUrl}`
    );
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
    return { ok: true, devMode: true };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: payment.user.email,
      subject: `Votre facture ${invoiceNumber} — Objectif TCF`,
      html: emailHtml,
    });

    if (error) {
      console.error("[Invoice] Email send failed:", error);
      return { ok: false, error: error.message };
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
    };
  });
}
