/** Messages Resend lisibles (domaine non vérifié, mode test, etc.). */
export function formatResendError(
  error: { message?: string; name?: string } | null
): string {
  if (!error?.message) return "Échec d'envoi Resend";
  const msg = error.message;

  if (/only send testing emails to your own/i.test(msg)) {
    return (
      "Resend est en mode test (onboarding@resend.dev) : l'envoi n'est possible " +
      "qu'à l'email du compte Resend. Vérifiez un domaine (ex. objectifcanada-tcf.com) " +
      "et définissez RESEND_FROM_EMAIL=noreply@votre-domaine.com sur Vercel."
    );
  }

  if (/domain|not verified|from/i.test(msg)) {
    return (
      `${msg} — Vérifiez RESEND_FROM_EMAIL (domaine vérifié sur Resend, ` +
      `ou onboarding@resend.dev pour les tests).`
    );
  }

  return msg;
}
