import {
  getAppUrl,
  getFromAddressIssue,
  isEmailConfigured,
} from "@/lib/email/config";
import { sendMail } from "@/lib/email/send-mail";
import { isSmtpConfigured } from "@/lib/email/smtp-client";
import type { SendEmailResult } from "@/lib/email/send-verification-email";

export type ContactMessageInput = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/** Boîte réelle où arrivent les messages du formulaire (pas l’adresse publique affichée). */
export function getContactInboxEmail(): string | null {
  const inbox = process.env.CONTACT_EMAIL?.trim();
  if (!inbox) return null;
  return inbox;
}

function buildContactHtml(input: ContactMessageInput): string {
  const baseUrl = getAppUrl();
  const logoUrl = `${baseUrl}/images/logo-nav.png`;
  const logoIconUrl = `${baseUrl}/images/logo-icon.png`;
  const flagCaUrl = `${baseUrl}/images/flags/ca.png`;
  const flagCmUrl = `${baseUrl}/images/flags/cm.png`;

  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const phoneRaw = input.phone?.trim() || "";
  const phone = phoneRaw ? escapeHtml(phoneRaw) : null;
  const message = escapeHtml(input.message).replace(/\n/g, "<br />");
  const initials = escapeHtml(initialsFromName(input.name));
  const when = escapeHtml(
    new Date().toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    })
  );
  const replySubject = encodeURIComponent(`Re: votre message — Objectif TCF`);
  const replyHref = `mailto:${email}?subject=${replySubject}`;
  const phoneHref = phoneRaw
    ? `tel:${phoneRaw.replace(/[^\d+]/g, "")}`
    : null;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nouveau message de contact</title>
</head>
<body style="margin:0;padding:0;background:#ece7f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ece7f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(79,55,138,0.18);">

          <!-- Header coloré -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f378a 0%,#6750a4 55%,#8b6fd4 100%);padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 28px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" valign="middle">
                          <img src="${logoUrl}" alt="Objectif TCF" width="160" style="display:block;max-width:160px;height:auto;border:0;" />
                        </td>
                        <td align="right" valign="middle">
                          <img src="${flagCaUrl}" alt="Canada" width="28" height="20" style="display:inline-block;border-radius:3px;border:0;margin-left:6px;vertical-align:middle;" />
                          <img src="${flagCmUrl}" alt="Cameroun" width="28" height="20" style="display:inline-block;border-radius:3px;border:0;margin-left:6px;vertical-align:middle;" />
                        </td>
                      </tr>
                    </table>
                    <p style="margin:22px 0 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#e9ddff;font-weight:700;">
                      Formulaire contact
                    </p>
                    <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;color:#ffffff;font-weight:700;">
                      Nouveau message ✉️
                    </h1>
                    <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.88);">
                      Reçu le ${when}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="height:8px;background:linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#c77dff);"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro + avatar -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="64" valign="top" style="padding-right:16px;">
                    <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#4f378a,#c77dff);color:#ffffff;font-size:18px;font-weight:700;line-height:56px;text-align:center;">
                      ${initials}
                    </div>
                  </td>
                  <td valign="middle">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#1c1b1f;">${name}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#6750a4;">
                      a écrit via la page Contact
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cartes infos colorées -->
          <tr>
            <td style="padding:16px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top" style="padding:0 6px 12px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ede7f6;border-radius:14px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0;font-size:20px;line-height:1;">📧</p>
                          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6750a4;font-weight:700;">Email</p>
                          <p style="margin:6px 0 0;font-size:14px;word-break:break-all;">
                            <a href="mailto:${email}" style="color:#4f378a;text-decoration:none;font-weight:600;">${email}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 12px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-radius:14px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0;font-size:20px;line-height:1;">📱</p>
                          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#2e7d32;font-weight:700;">Téléphone</p>
                          <p style="margin:6px 0 0;font-size:14px;font-weight:600;color:#1b5e20;">
                            ${
                              phone && phoneHref
                                ? `<a href="${phoneHref}" style="color:#1b5e20;text-decoration:none;">${phone}</a>`
                                : `<span style="color:#81c784;">Non renseigné</span>`
                            }
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:8px 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#faf8ff 0%,#ffffff 100%);border:2px solid #e9ddff;border-radius:16px;">
                <tr>
                  <td style="padding:4px 4px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(90deg,#4f378a,#6750a4);border-radius:12px 12px 0 0;">
                      <tr>
                        <td style="padding:10px 16px;">
                          <p style="margin:0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;font-weight:700;">
                            💬 Message
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px 22px;">
                    <p style="margin:0;font-size:16px;line-height:1.7;color:#1c1b1f;">
                      ${message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 28px 28px;">
              <a href="${replyHref}" style="display:inline-block;background:linear-gradient(135deg,#4f378a,#6750a4);color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 8px 20px rgba(79,55,138,0.35);">
                Répondre à ${name}
              </a>
              <p style="margin:14px 0 0;font-size:13px;color:#7a7582;line-height:1.5;">
                Ou répondez directement à cet email — le destinataire sera
                <strong style="color:#4f378a;">${email}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1c1b1f;padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="${logoIconUrl}" alt="" width="36" height="36" style="display:block;margin:0 auto 10px;border:0;border-radius:8px;" />
                    <p style="margin:0;font-size:13px;color:#ffffff;font-weight:700;">Objectif Canada TCF</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#b0a8c0;line-height:1.5;">
                      Message transmis depuis le formulaire Contact<br />
                      Adresse publique : contact@objectifcanada-tcf.com
                    </p>
                    <p style="margin:12px 0 0;">
                      <a href="${baseUrl}/contact" style="color:#cfbcff;font-size:12px;text-decoration:none;">Voir la page Contact →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function buildContactText(input: ContactMessageInput): string {
  return [
    "Nouveau message via le formulaire Contact — Objectif Canada TCF",
    "",
    `Nom : ${input.name}`,
    `Email : ${input.email}`,
    input.phone?.trim() ? `Téléphone : ${input.phone.trim()}` : "Téléphone : non renseigné",
    "",
    "Message :",
    input.message,
    "",
    "—",
    "Répondez directement à cet email pour contacter l’expéditeur.",
  ].join("\n");
}

export async function sendContactMessageEmail(
  input: ContactMessageInput
): Promise<SendEmailResult> {
  const to = getContactInboxEmail();
  if (!to) {
    return {
      ok: false,
      error:
        "CONTACT_EMAIL n’est pas configuré. Indiquez la boîte mail réelle qui doit recevoir les messages.",
    };
  }

  if (!isEmailConfigured()) {
    return {
      ok: false,
      error:
        "Email non configuré — ajoutez SMTP_USER/SMTP_PASS (Gmail) ou RESEND_API_KEY.",
    };
  }

  if (!isSmtpConfigured()) {
    const fromIssue = getFromAddressIssue();
    if (fromIssue) {
      return { ok: false, error: fromIssue };
    }
  }

  return sendMail({
    to,
    replyTo: input.email,
    subject: `[Contact] ${input.name} — message via le site`,
    html: buildContactHtml(input),
    text: buildContactText(input),
  });
}
