/** Adresse e-mail publique principale (affichée sur le site, factures, mentions légales). */
export const PUBLIC_CONTACT_EMAIL = "objectiftcf4c2@gmail.com";

/** Numéro de téléphone / WhatsApp public unique. */
export const PUBLIC_CONTACT_PHONE = "+237 671603280";

/** Même numéro, format `tel:` (sans espaces). */
export const PUBLIC_CONTACT_PHONE_TEL = "+237671603280";

/** Lien direct WhatsApp (ouvre la conversation). */
export const PUBLIC_WHATSAPP_URL = `https://wa.me/${PUBLIC_CONTACT_PHONE_TEL.replace(/\D/g, "")}`;

/** Boîte qui reçoit les messages du formulaire Contact (serveur uniquement). */
export function getContactInboxEmail(): string {
  return (
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    PUBLIC_CONTACT_EMAIL
  );
}
