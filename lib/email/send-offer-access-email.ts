import { getAppUrl, getFromAddress, isEmailConfigured } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/resend-client";
import type { SendEmailResult } from "@/lib/email/send-verification-email";

export type OfferAccessEmailInput = {
  to: string;
  recipientName: string;
  adminName: string;
  offerName: string;
  examLabel: string;
  days: number;
  periodEndLabel: string;
  /** true si le destinataire doit définir son mot de passe */
  isNewUser: boolean;
  /** Token reset (nouveaux comptes) ou null */
  setupToken?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOfferAccessHtml(input: OfferAccessEmailInput): string {
  const admin = escapeHtml(input.adminName);
  const offer = escapeHtml(input.offerName);
  const exam = escapeHtml(input.examLabel);
  const name = escapeHtml(input.recipientName);
  const end = escapeHtml(input.periodEndLabel);

  const ctaUrl = input.isNewUser && input.setupToken
    ? `${getAppUrl()}/reinitialisation-mot-de-passe?token=${encodeURIComponent(input.setupToken)}`
    : `${getAppUrl()}/connexion?redirect=${encodeURIComponent("/series")}`;

  const ctaLabel = input.isNewUser
    ? "Créer mon mot de passe et accéder"
    : "Accéder à mes séries";

  const setupNote = input.isNewUser
    ? `<p style="line-height: 1.6; margin: 0 0 24px;">
         Vous n'avez pas encore de compte : cliquez ci-dessous pour définir votre mot de passe et activer l'accès.
       </p>`
    : `<p style="line-height: 1.6; margin: 0 0 24px;">
         Connectez-vous à votre compte pour profiter immédiatement de l'accès premium.
       </p>`;

  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1b1f;">
      <div style="text-align: center; padding: 24px 0;">
        <p style="font-size: 14px; color: #6750a4; font-weight: 600; margin: 0;">Objectif TCF</p>
      </div>
      <div style="background: #faf8ff; border-radius: 16px; padding: 32px 24px;">
        <h1 style="color: #4f378a; font-size: 22px; margin: 0 0 16px;">
          Vous avez été ajouté(e) à une offre
        </h1>
        <p style="line-height: 1.6; margin: 0 0 8px;">Bonjour ${name},</p>
        <p style="line-height: 1.6; margin: 0 0 16px;">
          <strong>${admin}</strong> vous a accordé l'accès à l'offre
          <strong>${offer}</strong> (${exam}) sur Objectif TCF.
        </p>
        <div style="background: #ffffff; border: 1px solid #e7e0ec; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #7a7582;">Détails de l'accès</p>
          <p style="margin: 0 0 4px;"><strong>Offre :</strong> ${offer}</p>
          <p style="margin: 0 0 4px;"><strong>Examen :</strong> ${exam}</p>
          <p style="margin: 0 0 4px;"><strong>Durée :</strong> ${input.days} jour${input.days > 1 ? "s" : ""}</p>
          <p style="margin: 0;"><strong>Valide jusqu'au :</strong> ${end}</p>
        </div>
        ${setupNote}
        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f378a, #6750a4); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          ${ctaLabel}
        </a>
        <p style="color: #7a7582; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
          Si le bouton ne fonctionne pas, copiez ce lien :<br />
          <a href="${ctaUrl}" style="color: #6750a4; word-break: break-all;">${ctaUrl}</a>
        </p>
      </div>
      <p style="color: #9e9a9f; font-size: 12px; line-height: 1.5; margin-top: 24px; text-align: center;">
        Invitation envoyée par ${admin} via Objectif TCF. Merci de ne pas répondre à cet email.
      </p>
    </div>
  `;
}

export async function sendOfferAccessEmail(
  input: OfferAccessEmailInput
): Promise<SendEmailResult> {
  const subject = `${input.adminName} vous a ajouté à l'offre ${input.offerName} — Objectif TCF`;

  if (!isEmailConfigured()) {
    console.log(
      `[DEV] Offer access email → ${input.to} | offer=${input.offerName} | by=${input.adminName} | new=${input.isNewUser}`
    );
    return { ok: true, devMode: true };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject,
      html: buildOfferAccessHtml(input),
    });

    if (error) {
      console.error("[Email] Offer access send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi d'email inconnue";
    console.error("[Email] Offer access send error:", err);
    return { ok: false, error: message };
  }
}
