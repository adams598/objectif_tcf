import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );
}

export function getSmtpTransporter(): Transporter {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP_USER et SMTP_PASS sont requis");
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? "587");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
    });
  }

  return transporter;
}

export function getSmtpFromAddress(): string {
  const name =
    process.env.SMTP_FROM_NAME?.trim() ??
    process.env.RESEND_FROM_NAME?.trim() ??
    "Objectif TCF";
  const user = process.env.SMTP_USER!.trim();
  return `${name} <${user}>`;
}
