import { getFromAddress, isResendConfigured } from "@/lib/email/config";
import { formatResendError } from "@/lib/email/format-resend-error";
import { getResendClient } from "@/lib/email/resend-client";
import {
  getSmtpFromAddress,
  getSmtpTransporter,
  isSmtpConfigured,
} from "@/lib/email/smtp-client";
import type { SendEmailResult } from "@/lib/email/send-verification-email";

export type MailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

function normalizeAttachments(attachments?: MailAttachment[]) {
  if (!attachments?.length) return undefined;

  return attachments.map((file) => ({
    filename: file.filename,
    content:
      typeof file.content === "string"
        ? Buffer.from(file.content, "base64")
        : file.content,
    contentType: file.contentType,
  }));
}

async function sendViaSmtp(input: SendMailInput): Promise<SendEmailResult> {
  try {
    const transporter = getSmtpTransporter();
    await transporter.sendMail({
      from: getSmtpFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: normalizeAttachments(input.attachments),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur SMTP";
    console.error("[Email] SMTP send failed:", err);
    if (/invalid login|authentication/i.test(message)) {
      return {
        ok: false,
        error:
          "Connexion Gmail refusée — vérifiez SMTP_USER et SMTP_PASS (mot de passe d'application Google, pas le mot de passe du compte).",
      };
    }
    return { ok: false, error: message };
  }
}

async function sendViaResend(input: SendMailInput): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const attachments = input.attachments?.map((file) => ({
      filename: file.filename,
      content:
        typeof file.content === "string"
          ? file.content
          : file.content.toString("base64"),
      contentType: file.contentType,
    }));

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      ...(attachments?.length ? { attachments } : {}),
    });

    if (error) {
      console.error("[Email] Resend send failed:", error);
      return { ok: false, error: formatResendError(error) };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi d'email inconnue";
    console.error("[Email] Resend send error:", err);
    return { ok: false, error: message };
  }
}

/** Gmail SMTP en priorité si configuré, sinon Resend. */
export async function sendMail(input: SendMailInput): Promise<SendEmailResult> {
  if (isSmtpConfigured()) {
    return sendViaSmtp(input);
  }
  if (isResendConfigured()) {
    return sendViaResend(input);
  }
  return {
    ok: false,
    error:
      "Aucun service email configuré — définissez SMTP_USER/SMTP_PASS (Gmail) ou RESEND_API_KEY.",
  };
}

export function getActiveEmailProvider(): "smtp" | "resend" | null {
  if (isSmtpConfigured()) return "smtp";
  if (isResendConfigured()) return "resend";
  return null;
}
