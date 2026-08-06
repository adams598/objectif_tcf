/** Adresse e-mail publique principale (affichée sur le site, factures, mentions légales). */
export const PUBLIC_CONTACT_EMAIL = "objectiftcf4c2@gmail.com";

/** Boîte qui reçoit les messages du formulaire Contact (serveur uniquement). */
export function getContactInboxEmail(): string {
  return (
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    PUBLIC_CONTACT_EMAIL
  );
}
