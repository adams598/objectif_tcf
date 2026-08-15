import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
} from "@/lib/email/contact";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export interface FaqContent {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  categories: FaqCategory[];
}

const fr: FaqContent = {
  title: "Questions fréquemment posées",
  subtitle:
    "Trouvez rapidement une réponse. Si votre question n'y figure pas, contactez-nous.",
  searchPlaceholder: "Rechercher une question...",
  categories: [
    {
      id: "platform",
      title: "LA PLATEFORME",
      items: [
        {
          question: "Qu'est-ce qu'Objectif TCF ?",
          answer:
            "Objectif TCF est une plateforme de préparation aux examens TCF Canada, TEF Canada et IELTS. Vous vous entraînez dans des conditions proches de l'examen officiel, avec correction automatique pour CO/CE et correction par des correcteurs certifiés pour EE/EO.",
        },
        {
          question: "Puis-je essayer gratuitement avant de payer ?",
          answer:
            "Oui. Chaque examen propose des séries gratuites accessibles sans compte. Créez un compte gratuit pour sauvegarder votre progression et débloquer l'ensemble des séries avec un abonnement.",
        },
      ],
    },
    {
      id: "exams",
      title: "EXAMENS & ÉPREUVES",
      items: [
        {
          question: "Quels examens sont couverts ?",
          answer:
            "Objectif TCF couvre le TCF Canada, le TEF Canada et l'IELTS. Chaque examen propose les quatre compétences : compréhension orale, compréhension écrite, expression écrite et expression orale.",
        },
        {
          question: "Quelles sont les épreuves de chaque examen ?",
          answer:
            "Chaque examen comprend CO (compréhension orale), CE (compréhension écrite), EE (expression écrite) et EO (expression orale). Les formats et durées varient selon l'examen ; consultez la page À propos du TCF pour le détail du TCF Canada.",
        },
        {
          question: "Qu'est-ce qu'un examen blanc (une série) ?",
          answer:
            "Une série regroupe les quatre disciplines d'un examen dans l'ordre officiel. C'est l'équivalent d'un examen blanc complet pour vous entraîner en conditions réelles.",
        },
        {
          question: "Objectif TCF inscrit-il à l'examen officiel ?",
          answer:
            "Non. Objectif TCF est une plateforme de préparation. L'inscription à l'examen officiel se fait auprès d'un centre agréé (France Éducation international pour le TCF Canada).",
        },
      ],
    },
    {
      id: "correction",
      title: "CORRECTION & RÉSULTATS",
      items: [
        {
          question:
            "Comment sont corrigées les épreuves de compréhension (CO/CE) ?",
          answer:
            "Les QCM de compréhension orale et écrite sont corrigés automatiquement. Vous obtenez votre score et les bonnes réponses immédiatement après la série.",
        },
        {
          question:
            "Comment fonctionne la correction de l'expression écrite et orale (EE/EO) ?",
          answer:
            "Vos productions sont envoyées à des correcteurs certifiés qui évaluent le contenu, la structure, le vocabulaire et la grammaire selon les critères officiels de l'examen.",
        },
        {
          question: "En combien de temps ai-je le résultat de mon EE/EO ?",
          answer:
            "Les corrections EE/EO sont généralement disponibles sous 48 à 72 heures ouvrées. Vous recevez une notification dès que votre correction est prête.",
        },
      ],
    },
    {
      id: "subscription",
      title: "ABONNEMENTS & PAIEMENT",
      items: [
        {
          question: "Comment souscrire un abonnement ?",
          answer:
            "Rendez-vous sur la page Tarifs, choisissez l'offre adaptée à votre examen et procédez au paiement sécurisé. Votre accès est activé automatiquement après confirmation du paiement.",
        },
        {
          question: "Quels moyens de paiement sont acceptés ?",
          answer:
            "Nous acceptons le Mobile Money (MTN, Orange, Wave, etc.) et les cartes bancaires via pawaPay, selon votre pays. Devises : franc CFA (XAF/XOF) et dollar US (USD).",
        },
        {
          question: "Quelle différence entre un abonnement et une recharge ?",
          answer:
            "L'abonnement débloque l'accès complet aux séries premium pour la durée choisie. Une recharge ajoute des crédits de correction EE/EO si votre offre le prévoit.",
        },
        {
          question: "Mon paiement n'a pas activé mon accès, que faire ?",
          answer:
            `Contactez-nous via WhatsApp (${PUBLIC_CONTACT_PHONE}) ou le formulaire de contact en indiquant votre email et la référence de transaction. Notre équipe réactive votre accès sous 24 h.`,
        },
      ],
    },
    {
      id: "mobile",
      title: "APPLICATION MOBILE & HORS-LIGNE",
      items: [
        {
          question: "Puis-je m'entraîner sans connexion internet ?",
          answer:
            "Certaines séries peuvent être téléchargées pour une utilisation hors-ligne. Vos résultats seront synchronisés dès que vous retrouverez une connexion.",
        },
        {
          question: "Que deviennent mes résultats faits hors-ligne ?",
          answer:
            "Ils sont enregistrés localement puis synchronisés automatiquement avec votre compte lors de la reconnexion.",
        },
      ],
    },
    {
      id: "partnership",
      title: "PARTENARIAT",
      items: [
        {
          question: "Puis-je devenir partenaire d'Objectif TCF ?",
          answer:
            `Oui, nous collaborons avec des centres de formation, des professeurs et des influenceurs. Contactez-nous via le formulaire de contact ou par email à ${PUBLIC_CONTACT_EMAIL}.`,
        },
      ],
    },
  ],
};

const en: FaqContent = {
  title: "Frequently asked questions",
  subtitle:
    "Find a quick answer. If your question isn't listed, contact us.",
  searchPlaceholder: "Search a question...",
  categories: fr.categories.map((cat) => ({
    ...cat,
    title:
      cat.id === "platform"
        ? "THE PLATFORM"
        : cat.id === "exams"
          ? "EXAMS & TESTS"
          : cat.id === "correction"
            ? "CORRECTION & RESULTS"
            : cat.id === "subscription"
              ? "SUBSCRIPTIONS & PAYMENT"
              : cat.id === "mobile"
                ? "MOBILE APP & OFFLINE"
                : "PARTNERSHIP",
  })),
};

export function getFaqContent(locale: string): FaqContent {
  return locale.startsWith("en") ? en : fr;
}
