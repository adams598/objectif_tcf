import { getAppUrl, getFromAddress, isEmailConfigured } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/resend-client";

export type SendEmailResult =
  | { ok: true; devMode?: boolean }
  | { ok: false; error: string };

function buildVerificationHtml(name: string, verificationUrl: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1b1f;">
      <div style="text-align: center; padding: 24px 0;">
        <p style="font-size: 14px; color: #6750a4; font-weight: 600; margin: 0;">Objectif TCF</p>
      </div>
      <div style="background: #faf8ff; border-radius: 16px; padding: 32px 24px;">
        <h1 style="color: #4f378a; font-size: 22px; margin: 0 0 16px;">Bienvenue, ${name} !</h1>
        <p style="line-height: 1.6; margin: 0 0 24px;">
          Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.
        </p>
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f378a, #6750a4); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          Vérifier mon email
        </a>
        <p style="color: #7a7582; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
          Ce lien expire dans 24 heures. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
          <a href="${verificationUrl}" style="color: #6750a4; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
      <p style="color: #9e9a9f; font-size: 12px; line-height: 1.5; margin-top: 24px; text-align: center;">
        Cet email a été envoyé automatiquement depuis une adresse no-reply. Merci de ne pas y répondre.
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<SendEmailResult> {
  const verificationUrl = `${getAppUrl()}/verification-email?token=${encodeURIComponent(token)}`;

  if (!isEmailConfigured()) {
    console.log(`[DEV] Verification URL for ${email}: ${verificationUrl}`);
    return { ok: true, devMode: true };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Vérifiez votre email — Objectif TCF",
      html: buildVerificationHtml(name, verificationUrl),
    });

    if (error) {
      console.error("[Email] Verification send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi d'email inconnue";
    console.error("[Email] Verification send error:", err);
    return { ok: false, error: message };
  }
}
