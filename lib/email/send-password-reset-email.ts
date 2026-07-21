import { getAppUrl, getFromAddress, isEmailConfigured } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/resend-client";
import type { SendEmailResult } from "@/lib/email/send-verification-email";

function buildResetHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1b1f;">
      <div style="text-align: center; padding: 24px 0;">
        <p style="font-size: 14px; color: #6750a4; font-weight: 600; margin: 0;">Objectif TCF</p>
      </div>
      <div style="background: #faf8ff; border-radius: 16px; padding: 32px 24px;">
        <h1 style="color: #4f378a; font-size: 22px; margin: 0 0 16px;">Réinitialisation de votre mot de passe</h1>
        <p style="line-height: 1.6; margin: 0 0 8px;">Bonjour ${name},</p>
        <p style="line-height: 1.6; margin: 0 0 24px;">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f378a, #6750a4); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color: #7a7582; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
      <p style="color: #9e9a9f; font-size: 12px; line-height: 1.5; margin-top: 24px; text-align: center;">
        Cet email a été envoyé automatiquement depuis une adresse no-reply. Merci de ne pas y répondre.
      </p>
    </div>
  `;
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<SendEmailResult> {
  const resetUrl = `${getAppUrl()}/reinitialisation-mot-de-passe?token=${encodeURIComponent(token)}`;

  if (!isEmailConfigured()) {
    console.log(`[DEV] Reset URL for ${email}: ${resetUrl}`);
    return { ok: true, devMode: true };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Réinitialisez votre mot de passe — Objectif TCF",
      html: buildResetHtml(name, resetUrl),
    });

    if (error) {
      console.error("[Email] Password reset send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi d'email inconnue";
    console.error("[Email] Password reset send error:", err);
    return { ok: false, error: message };
  }
}
