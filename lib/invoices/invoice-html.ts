import { getAppUrl } from "@/lib/email/config";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/email/contact";
import type { InvoiceData } from "@/lib/invoices/types";
import { getInvoiceCompanyConfig } from "@/lib/invoices/company-config";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInvoiceHtml(
  invoice: InvoiceData,
  options?: { forEmail?: boolean }
): string {
  const appUrl = getAppUrl();
  const forEmail = options?.forEmail ?? false;
  const company = getInvoiceCompanyConfig();
  const companyEmail = company.email || PUBLIC_CONTACT_EMAIL;

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;color:#7a7582;font-size:14px;width:42%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#1c1b1f;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Facture ${escapeHtml(invoice.invoiceNumber)} — Objectif TCF</title>
  <style>
    @media print {
      body { background: #fff !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:24px;background:#f6f2ff;font-family:Inter,Arial,sans-serif;color:#1c1b1f;">
  <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e7e0ec;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(79,55,138,0.08);">
    <div style="padding:32px 32px 24px;background:linear-gradient(135deg,#4f378a,#6750a4);color:#ffffff;">
      <p style="margin:0 0 8px;font-size:13px;opacity:0.9;letter-spacing:0.08em;text-transform:uppercase;">Objectif TCF</p>
      <h1 style="margin:0;font-size:28px;font-weight:700;">Facture d'abonnement</h1>
      <p style="margin:12px 0 0;font-size:15px;opacity:0.95;">${escapeHtml(invoice.invoiceNumber)}</p>
    </div>

    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#7a7582;text-transform:uppercase;letter-spacing:0.06em;">Émetteur</p>
            <p style="margin:0;font-size:15px;font-weight:700;">Objectif Canada TCF</p>
            <p style="margin:6px 0 0;font-size:14px;color:#49454f;line-height:1.6;">
              Plateforme e-learning de préparation TCF, TEF et IELTS<br />
              ${escapeHtml(companyEmail)}<br />
              objectifcanada-tcf.com
            </p>
          </td>
          <td style="width:50%;vertical-align:top;padding-left:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#7a7582;text-transform:uppercase;letter-spacing:0.06em;">Client</p>
            <p style="margin:0;font-size:15px;font-weight:700;">${escapeHtml(invoice.customerName)}</p>
            <p style="margin:6px 0 0;font-size:14px;color:#49454f;">${escapeHtml(invoice.customerEmail)}</p>
          </td>
        </tr>
      </table>

      <div style="background:#faf8ff;border:1px solid #eaddff;border-radius:16px;padding:24px;margin-bottom:28px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#4f378a;">Détails de l'abonnement</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${row("Produit / offre", invoice.description)}
          ${row("Examen concerné", invoice.examTypeLabel)}
          ${row("Durée d'accès", `${invoice.subscriptionDays} jour(s)`)}
          ${row("Date de début", invoice.periodStart)}
          ${row("Date de fin de validité", invoice.periodEnd)}
          ${row("Date de paiement", invoice.paidAt)}
          ${row("Statut", invoice.statusLabel)}
        </table>
      </div>

      <div style="background:#f7f2fa;border-radius:16px;padding:24px;margin-bottom:28px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#4f378a;">Paiement</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${row("Montant payé", invoice.amountFormatted)}
          ${row("Devise", invoice.currency)}
          ${invoice.paymentMethod ? row("Moyen de paiement", invoice.paymentMethod) : ""}
          ${invoice.paymentProvider ? row("Prestataire", invoice.paymentProvider) : ""}
          ${invoice.providerReference ? row("Référence transaction", invoice.providerReference) : ""}
          ${row("Référence facture", invoice.invoiceNumber)}
        </table>
        <p style="margin:20px 0 0;font-size:28px;font-weight:700;color:#4f378a;text-align:right;">
          Total : ${escapeHtml(invoice.amountFormatted)}
        </p>
      </div>

      <div style="border-top:1px solid #e7e0ec;padding-top:20px;">
        <p style="margin:0 0 8px;font-size:13px;color:#7a7582;line-height:1.6;">
          Cette facture atteste du paiement de votre abonnement numérique. L'accès est activé pour la période indiquée ci-dessus.
          Les conditions de remboursement et de rétractation sont disponibles sur
          <a href="${appUrl}/remboursement" style="color:#6750a4;">${appUrl}/remboursement</a>.
        </p>
        <p style="margin:0;font-size:13px;color:#7a7582;line-height:1.6;">
          Service numérique — facture émise automatiquement après confirmation du paiement.
        </p>
        ${
          forEmail
            ? `<p style="margin:18px 0 0;">
                <a href="${escapeHtml(invoice.downloadUrl)}" style="display:inline-block;background:linear-gradient(135deg,#4f378a,#6750a4);color:#ffffff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600;">
                  Télécharger la facture
                </a>
              </p>`
            : `<p class="no-print" style="margin:18px 0 0;font-size:13px;color:#7a7582;">
                Vous pouvez imprimer cette page ou l'enregistrer au format PDF depuis votre navigateur.
              </p>`
        }
      </div>
    </div>
  </div>
</body>
</html>`;
}
