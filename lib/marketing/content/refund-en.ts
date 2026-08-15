import type { LegalContent } from "@/lib/marketing/content/legal";
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
  PUBLIC_CONTACT_PHONE_TEL,
  PUBLIC_WHATSAPP_URL,
} from "@/lib/email/contact";

export const refundEn: LegalContent = {
  title: "Refund and Return Policy",
  lastUpdated: "Terms applicable to Objectif TCF subscriptions",
  sections: [
    {
      title: "1. Interpretation and definitions",
      subsections: [
        {
          title: "1.1. Interpretation",
          paragraphs: [
            "Terms whose first letter is capitalised have the meanings assigned to them below. These definitions apply equally to the singular and the plural.",
          ],
        },
        {
          title: "1.2. Definitions",
          paragraphs: [
            "For the purposes of this Refund and Return Policy, the following terms are defined as follows:",
          ],
          list: [
            {
              text: "The Company: means objectif canada tcf.",
            },
            {
              text: "The Products: mean subscriptions to the TCF and TEF online language-test preparation services offered on the Service.",
            },
            {
              text: "The Orders: mean any request by you to purchase a subscription from us.",
            },
            {
              text: "The Service: means the stand-alone objectif-canada-tcf e-learning web application and all of its content.",
            },
            {
              text: "The Website: means the Objectif TCF website, accessible [by clicking here](https://objectif-tcf.org).",
            },
            {
              text: "You: means the natural person who accesses or uses the Service, or the legal person (company or other legal entity) on whose behalf that person accesses or uses the Service, as applicable.",
            },
          ],
        },
      ],
    },
    {
      title: "2. Free trial version and consent to subscribe",
      paragraphs: [
        "Our e-learning web application provides a free trial of unlimited duration for each exam (TCF and TEF) as well as for each of the tests that make up those exams.",
        "By subscribing to a paid plan, you acknowledge that you have fully tested the Website, its various features and its content, and that you have expressly approved them. Consequently, no refund request may be accepted on the grounds of unfamiliarity with the Website’s content or features.",
      ],
    },
    {
      title: "3. Your order cancellation rights (legal conditions)",
      paragraphs: [
        "In accordance with the legal provisions in force relating to the right of withdrawal, you benefit from the time limits and conditions provided by law.",
        "In accordance with Cameroonian law, you have a period of 48 hours from the date of subscription to exercise your right of withdrawal, without having to give reasons or pay penalties, except, where applicable, for return costs.",
        "To exercise this right, you must notify us of your decision to withdraw, before the expiry of the aforementioned period, by a clear and unequivocal statement (for example, by post, fax or email).",
        "However, in accordance with applicable law, the right of withdrawal can no longer be exercised once performance of the service has begun, with your express agreement, before the end of the withdrawal period. Given the nature of our services, which consist of immediate access to an online preparation platform, subscribing to a paid plan constitutes your express consent to the start of the service.",
      ],
    },
    {
      title: "4. Specific cancellation conditions (48-hour period)",
      paragraphs: [
        "In addition to the legal provisions, the following specific cancellation conditions also apply:",
        "You also have the right to cancel your order within forty-eight (48) hours of the subscription date, without having to give a reason, provided that you have not begun to actively use the service for which you subscribed (for example, by accessing paid content beyond the trial version).",
        "The cancellation period for an Order expires forty-eight (48) hours after the date of subscription to the pack.",
        "In order to exercise your right of withdrawal, you must inform us of your decision by means of a clear statement. You may inform us of your decision by the following means:",
      ],
      list: [
        {
          text: `By email at: [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: "By visiting the dedicated page on our Website: [objectif-tcf.org](https://objectif-tcf.org).",
        },
        {
          text: `By phone at: [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `By WhatsApp: [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
      ],
      paragraphsAfterList: [
        "We will process the refund within a maximum of fourteen (14) days from the date we receive your withdrawal notice. The refund will be made using the same payment method you used for the order, at no additional cost to you.",
        "N.B. Account sharing between users is strictly prohibited and will result in the immediate and irreversible deletion of your account.",
      ],
    },
    {
      title: "5. Payment methods",
      paragraphs: [
        "We provide various payment methods, including in particular mobile payment and payment by bank card. Each user agrees to comply with the specific terms of use of the selected payment method. We decline any liability for any fees or conditions imposed by the providers of these payment services.",
      ],
    },
    {
      title: "6. Contact us",
      paragraphs: [
        "For any question relating to our return and refund policy, please contact us:",
      ],
      list: [
        {
          text: `By email: [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: `By phone: [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `By WhatsApp: [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
      ],
    },
  ],
};
