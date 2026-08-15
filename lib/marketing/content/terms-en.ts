import type { LegalContent } from "@/lib/marketing/content/legal";
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
  PUBLIC_CONTACT_PHONE_TEL,
  PUBLIC_WHATSAPP_URL,
} from "@/lib/email/contact";

const SITE_URL = "https://objectif-tcf.org";

export const termsEn: LegalContent = {
  title: "Terms of Use",
  lastUpdated: "Last updated: 15 August 2026",
  sections: [
    {
      title: "Preamble",
      paragraphs: [
        `These Terms of Use (hereinafter the “Terms”) govern access to and use of the Objectif TCF platform, available at [${SITE_URL}](${SITE_URL}), as well as any subscription to a paid plan.`,
        "They constitute a contract between the Company and any natural or legal person using the Service (the “User”). Any registration, order or payment implies full and unreserved acceptance of these Terms.",
        "These Terms are supplemented by the [Privacy Policy](/confidentialite) and the [Refund Policy](/remboursement).",
      ],
    },
    {
      title: "1. Identity of the seller",
      paragraphs: [
        "The Service is published and marketed by Objectif Canada TCF, operating under the trade name Objectif TCF (hereinafter the “Company”).",
      ],
      list: [
        { text: `Website: [${SITE_URL}](${SITE_URL})` },
        {
          text: `Email: [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: `Phone: [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `WhatsApp: [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
      ],
      paragraphsAfterList: [
        "The Company is not affiliated with France Éducation international, Immigration, Refugees and Citizenship Canada (IRCC), IELTS, the British Council, IDP or any other official examining body. Objectif TCF is a private preparation platform.",
      ],
    },
    {
      title: "2. Definitions",
      paragraphs: [
        "For the purposes of these Terms, the following terms have the meanings set out below, whether used in the singular or the plural:",
      ],
      list: [
        {
          text: "Service: the Objectif TCF e-learning platform, including in particular practice series, exam simulations, grading, the dashboard, messaging, the community and associated documents.",
        },
        {
          text: "Account: the personal space created by the User upon registration.",
        },
        {
          text: "Subscription: paid access to the Service for one exam type (TCF Canada, TEF Canada or IELTS) and for a fixed period, whether a packaged plan or a per-day rate.",
        },
        {
          text: "Free Content: series and features expressly identified as free, accessible without a Subscription.",
        },
        {
          text: "Premium Content: all series, grading, documents and features reserved for holders of an active Subscription.",
        },
        {
          text: "Order: any Subscription purchase made on the Site that results in a payment.",
        },
      ],
    },
    {
      title: "3. Purpose",
      paragraphs: [
        "The Terms define the conditions under which the Company provides an online preparation service for the TCF Canada, TEF Canada and IELTS language exams, and the rights and obligations of the parties.",
        "The Service is intended to train the User (listening comprehension, reading comprehension, written expression, spoken expression), to track their progress and, where applicable, to have their productions graded by artificial intelligence and/or human graders.",
      ],
    },
    {
      title: "4. Acceptance and enforceability",
      paragraphs: [
        "The User declares that they have the legal capacity to enter into a contract. If the User is a minor, they may register and subscribe only with the consent of their legal representative, who remains responsible for use of the Service.",
        "Acceptance of the Terms is evidenced, upon registration, by ticking the box provided for that purpose and, upon each Order, by proceeding with payment. This acceptance is firm and final.",
        "The applicable Terms are those in force on the date of registration or of the Order. They may be consulted at any time on the Site and downloaded as a PDF from the public terms page.",
      ],
    },
    {
      title: "5. Description of the Service",
      paragraphs: [
        "Depending on the Subscription purchased and the features enabled, the Service may include in particular:",
      ],
      list: [
        {
          text: "practice series and simulations (listening and reading comprehension, written and spoken expression);",
        },
        {
          text: "a progress dashboard and NCLC-type indicators;",
        },
        {
          text: "automatic grading of multiple-choice questions and artificial-intelligence feedback on writing;",
        },
        {
          text: "grading by a human examiner or grader, subject to the Company’s capacity and timeframes;",
        },
        {
          text: "access to the community, messaging and documents (results, invoices);",
        },
        {
          text: "a free trial covering certain series identified as such.",
        },
      ],
      paragraphsAfterList: [
        "The Company reserves the right to evolve the series catalogue, materials, features and grading arrangements, provided this does not result in a substantial reduction of the subject matter of an ongoing Subscription.",
        "Commercial claims (success rates, “C2”, “NCLC 9”, etc.) constitute learning goals and illustrations. No official exam result is guaranteed.",
      ],
    },
    {
      title: "6. User account",
      paragraphs: [
        "Registration requires a valid email address. An account may also be created via Google OAuth. The User agrees to provide accurate information and to keep it up to date.",
        "Credentials are personal and confidential. Account sharing, resale of access or simultaneous use by several people is strictly prohibited and may result in immediate and irreversible suspension or deletion of the Account, without refund.",
        "The User is responsible for all activity carried out from their Account. They shall promptly inform the Company of any unauthorised use.",
        "The Company may deactivate an Account in the event of a serious breach of the Terms, payment fraud, infringement of third-party rights or abusive behaviour (community, messaging, graders).",
      ],
    },
    {
      title: "7. Plans, prices and Orders",
      paragraphs: [
        "Plans relate to one exam type (TCF Canada, TEF Canada or IELTS). Two arrangements exist:",
      ],
      list: [
        {
          text: "packaged plans (duration and price displayed in XAF, USD and XOF);",
        },
        {
          text: "a dynamic per-day rate, for a duration of between 15 and 365 days, according to the pricing configuration published at the time of the Order.",
        },
      ],
      paragraphsAfterList: [
        "Prices are stated inclusive of all taxes according to the applicable regime. Unless otherwise stated, digital services are invoiced excluding VAT under the rules of the Company’s country; the statements on the invoice prevail.",
        "The Order becomes firm when payment is accepted by the provider (card, Mobile Money or any other offered method). A confirmation email and an invoice are sent when the sending service is operational. The Subscription is activated upon receipt of payment confirmation (webhook or verification with the provider).",
        "The Company may correct an obvious pricing error before or after an Order; in that case, the User may request cancellation and a refund of the amount paid.",
      ],
    },
    {
      title: "8. Payment",
      paragraphs: [
        "The payment methods offered depend on the User’s country and currency. They may include, without this list being exhaustive: Mobile Money (MTN, Orange, Wave, etc.) and bank card (Visa, Mastercard) via pawaPay, or any other provider the Company chooses to enable.",
        "Payment is processed by third-party providers. The User accepts their terms. The Company does not have access to full card data. Any fees charged by the mobile operator, bank or provider remain the User’s responsibility.",
        "In the event of a refused, fraudulent or subsequently disputed payment (chargeback), the Company may suspend the Subscription and, where applicable, claim the amounts due.",
        "Available currencies include in particular the Central African CFA franc (XAF), the West African CFA franc (XOF) and the US dollar (USD). Any conversions displayed are indicative.",
      ],
    },
    {
      title: "9. Access to the Service (performance)",
      paragraphs: [
        "The Subscription is a digital service provided immediately. Access to Premium Content is opened as soon as payment is validated, for the purchased duration, on the relevant exams.",
        "By proceeding with payment, the User expressly requests immediate performance of the service and acknowledges that, in accordance with the rules applicable to digital content, the right of withdrawal may be limited once performance has begun.",
        "The free trial does not give access to Premium Content. Expiry of the Subscription ends that access, without prejudice to result data already generated, which remain viewable according to the features still available.",
      ],
    },
    {
      title: "10. Right of withdrawal and refund",
      paragraphs: [
        "Detailed conditions are set out in the [Refund Policy](/remboursement), which forms an integral part of these Terms.",
        "Subject to mandatory legal provisions, the User has a period of forty-eight (48) hours from subscription to request withdrawal, provided they have not used Premium Content beyond the free trial.",
        "The request must be made clearly (email, phone or WhatsApp using the contact details in article 1). Any refund due is made using the same payment method, within a maximum of fourteen (14) days.",
        "No refund is due in the event of Account sharing, fraud, a serious breach of the Terms, or where Premium Content has been consumed.",
      ],
    },
    {
      title: "11. Intellectual property",
      paragraphs: [
        "All elements of the Service (texts, questions, scoring scales, audio, visuals, software, trademarks, the Objectif TCF logo, methodology) are protected. They remain the property of the Company or its licensors.",
        "The Subscription grants a personal, non-exclusive, non-transferable right of use, limited to the duration of the Subscription. Any reproduction, mass extraction, resale, public making available or training of artificial-intelligence models from the content is prohibited.",
        "The User’s productions (writings, oral recordings) remain their property. The User grants the Company a non-exclusive, royalty-free licence to host them, grade them and improve the Service, in accordance with the Privacy Policy.",
      ],
    },
    {
      title: "12. User obligations",
      paragraphs: [
        "The User agrees to:",
      ],
      list: [
        {
          text: "use the Service in accordance with its educational purpose, in good faith;",
        },
        {
          text: "not circumvent access controls, extract content by automated means or undermine the security of the Site;",
        },
        {
          text: "not publish unlawful, defamatory or hateful content, or content that infringes third-party rights, in the community or messaging;",
        },
        {
          text: "respect graders, other candidates and the Company’s staff;",
        },
        {
          text: "have suitable equipment and an internet connection (including a microphone for speaking).",
        },
      ],
    },
    {
      title: "13. Availability, maintenance and liability",
      paragraphs: [
        "The Company endeavours to provide continuous access to the Service, subject to maintenance operations, failures of providers (hosting, payment, email, storage) and force majeure.",
        "The Service is provided “as is”. Scores, AI feedback and NCLC indicators are training tools: they do not replace an official exam or immigration advice.",
        "The Company’s liability is limited, all causes combined, to the amount of the Subscription paid by the User over the last twelve (12) months. Indirect losses are excluded (loss of chance at an exam, loss of an immigration file, data loss attributable to the User).",
        "Nothing in these Terms excludes liability for wilful misconduct, gross negligence, or harm to physical integrity, within the limits of applicable public-policy rules.",
      ],
    },
    {
      title: "14. Personal data",
      paragraphs: [
        "The processing of data (account, payments, scripts, oral recordings, connection logs) is described in the [Privacy Policy](/confidentialite).",
        "By using the Service, the User is informed that providers (host, payment, email, file storage) may process data on behalf of the Company, to the extent necessary for performance of the contract.",
      ],
    },
    {
      title: "15. Duration, termination and deletion",
      paragraphs: [
        "The Account is opened for an indefinite period. The Subscription ends at the expiry of the paid period, unless renewal is expressly offered and accepted (for example via a subscription payment provider).",
        "The User may request closure of their Account at any time by contacting the Company. Closure does not entail a refund of periods already started, except as provided in article 10.",
        "The Company may terminate the Account in the event of a breach, with immediate effect in the case of a serious breach. Unlawful content may be removed without notice.",
      ],
    },
    {
      title: "16. Amendment of the Terms",
      paragraphs: [
        "The Company may amend the Terms. The up-to-date version is published on the Site with its date. Substantial changes are brought to Users’ attention (banner, email or notification) when they affect ongoing Subscriptions.",
        "Continued use of the Service after they take effect constitutes acceptance, except for Users who close their Account before that date.",
      ],
    },
    {
      title: "17. Governing law and disputes",
      paragraphs: [
        "These Terms are governed by Cameroonian law, subject to the public-policy rules of the country of residence of a consumer User.",
        "In the event of a dispute, the parties shall endeavour to find an amicable solution. Failing that, the competent courts of the Company’s registered office shall have jurisdiction, subject to mandatory consumer-protection jurisdiction rules.",
      ],
    },
    {
      title: "18. Contact",
      paragraphs: [
        "For any question relating to these Terms, an Order or a Subscription:",
      ],
      list: [
        {
          text: `Email: [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: `Phone: [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `WhatsApp: [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
        { text: `Website: [${SITE_URL}](${SITE_URL})` },
      ],
    },
  ],
};
