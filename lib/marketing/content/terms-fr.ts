import type { LegalContent } from "@/lib/marketing/content/legal";
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
  PUBLIC_CONTACT_PHONE_TEL,
  PUBLIC_WHATSAPP_URL,
} from "@/lib/email/contact";

const SITE_URL = "https://objectif-tcf.org";

export const termsFr: LegalContent = {
  title: "Conditions d'utilisation",
  lastUpdated: "Dernière mise à jour : 15 août 2026",
  sections: [
    {
      title: "Préambule",
      paragraphs: [
        `Les présentes Conditions d'utilisation (ci-après les « CGU ») régissent l'accès et l'utilisation de la plateforme Objectif TCF, accessible à l'adresse [${SITE_URL}](${SITE_URL}), ainsi que toute souscription à un abonnement payant.`,
        "Elles constituent un contrat entre la Société et toute personne physique ou morale utilisant le Service (l'« Utilisateur »). Toute inscription, commande ou paiement emporte acceptation pleine et entière des présentes CGU.",
        "Les présentes CGU sont complétées par la [Politique de confidentialité](/confidentialite) et les [Conditions de remboursement](/remboursement).",
      ],
    },
    {
      title: "1. Identité du vendeur",
      paragraphs: [
        "Le Service est édité et commercialisé par Objectif Canada TCF, exerçant sous le nom commercial Objectif TCF (ci-après la « Société »).",
      ],
      list: [
        { text: `Site internet : [${SITE_URL}](${SITE_URL})` },
        {
          text: `Courriel : [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: `Téléphone : [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `WhatsApp : [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
      ],
      paragraphsAfterList: [
        "La Société n'est pas affiliée à France Éducation international, à Immigration, Réfugiés et Citoyenneté Canada (IRCC), à IELTS, au British Council, à IDP ni à tout autre organisme officiel d'examen. Objectif TCF est une plateforme privée de préparation.",
      ],
    },
    {
      title: "2. Définitions",
      paragraphs: [
        "Pour l'application des présentes CGU, les termes suivants ont la signification indiquée ci-dessous, qu'ils soient employés au singulier ou au pluriel :",
      ],
      list: [
        {
          text: "Service : la plateforme e-learning Objectif TCF, comprenant notamment les séries d'entraînement, les simulations d'examen, les corrections, le tableau de bord, la messagerie, la communauté et les documents associés.",
        },
        {
          text: "Compte : l'espace personnel créé par l'Utilisateur lors de son inscription.",
        },
        {
          text: "Abonnement : l'accès payant au Service pour un type d'examen (TCF Canada, TEF Canada ou IELTS) et pour une durée déterminée, qu'il s'agisse d'une offre packagée ou d'un tarif calculé au jour.",
        },
        {
          text: "Contenu gratuit : les séries et fonctionnalités expressément identifiées comme gratuites, accessibles sans Abonnement.",
        },
        {
          text: "Contenu premium : l'ensemble des séries, corrections, documents et fonctionnalités réservés aux titulaires d'un Abonnement actif.",
        },
        {
          text: "Commande : toute souscription d'un Abonnement réalisée sur le Site, aboutissant à un paiement.",
        },
      ],
    },
    {
      title: "3. Objet",
      paragraphs: [
        "Les CGU ont pour objet de définir les conditions dans lesquelles la Société propose un service de préparation en ligne aux examens de langue TCF Canada, TEF Canada et IELTS, et les droits et obligations des parties.",
        "Le Service vise à entraîner l'Utilisateur (compréhension orale, compréhension écrite, expression écrite, expression orale), à suivre sa progression et, le cas échéant, à faire corriger ses productions par l'intelligence artificielle et/ou par des correcteurs humains.",
      ],
    },
    {
      title: "4. Acceptation et opposabilité",
      paragraphs: [
        "L'Utilisateur déclare avoir la capacité juridique de contracter. S'il est mineur, il ne peut s'inscrire et souscrire qu'avec l'accord de son représentant légal, qui demeure responsable de l'utilisation du Service.",
        "L'acceptation des CGU est matérialisée, lors de l'inscription, par le cochage de la case prévue à cet effet, et, lors de chaque Commande, par la poursuite du paiement. Cette acceptation est ferme et définitive.",
        "Les CGU applicables sont celles en vigueur au jour de l'inscription ou de la Commande. Elles sont consultables à tout moment sur le Site et téléchargeables au format PDF depuis la page publique des conditions.",
      ],
    },
    {
      title: "5. Description du Service",
      paragraphs: [
        "Selon l'Abonnement souscrit et les fonctionnalités activées, le Service peut notamment comprendre :",
      ],
      list: [
        {
          text: "des séries d'entraînement et simulations (compréhension orale et écrite, expression écrite et orale) ;",
        },
        {
          text: "un tableau de bord de progression et des indicateurs de type NCLC ;",
        },
        {
          text: "la correction automatique de QCM et un feedback d'intelligence artificielle sur l'écrit ;",
        },
        {
          text: "la correction par un examinateur ou correcteur humain, dans la limite des capacités et délais de la Société ;",
        },
        {
          text: "l'accès à la communauté, à la messagerie et aux documents (résultats, factures) ;",
        },
        {
          text: "un essai gratuit portant sur certaines séries identifiées comme telles.",
        },
      ],
      paragraphsAfterList: [
        "La Société se réserve le droit de faire évoluer le catalogue de séries, les supports, les fonctionnalités et les modalités de correction, dès lors que cela n'entraîne pas une diminution substantielle de l'objet de l'Abonnement en cours.",
        "Les mentions commerciales (taux de réussite, « C2 », « NCLC 9 », etc.) constituent des objectifs pédagogiques et des illustrations. Aucun résultat d'examen officiel n'est garanti.",
      ],
    },
    {
      title: "6. Compte utilisateur",
      paragraphs: [
        "L'inscription nécessite une adresse e-mail valide. Un compte peut également être créé via Google OAuth. L'Utilisateur s'engage à fournir des informations exactes et à les tenir à jour.",
        "Les identifiants sont personnels et confidentiels. Le partage de Compte, la revente d'accès ou l'utilisation simultanée par plusieurs personnes est strictement interdit et peut entraîner la suspension ou la suppression immédiate et irréversible du Compte, sans remboursement.",
        "L'Utilisateur est responsable de toute activité réalisée depuis son Compte. Il informe sans délai la Société en cas d'usage non autorisé.",
        "La Société peut désactiver un Compte en cas de manquement grave aux CGU, de fraude au paiement, d'atteinte aux droits de tiers ou de comportement abusif (communauté, messagerie, correcteurs).",
      ],
    },
    {
      title: "7. Offres, prix et Commande",
      paragraphs: [
        "Les offres portent sur un type d'examen (TCF Canada, TEF Canada ou IELTS). Deux modalités existent :",
      ],
      list: [
        {
          text: "offres packagées (durée et prix affichés en XAF, USD et XOF) ;",
        },
        {
          text: "tarif dynamique au jour, pour une durée comprise entre 15 et 365 jours, selon la configuration tarifaire publiée au moment de la Commande.",
        },
      ],
      paragraphsAfterList: [
        "Les prix sont indiqués toutes taxes comprises selon le régime applicable. Sauf mention contraire, les prestations numériques sont facturées hors TVA selon les règles du pays de la Société ; les mentions figurant sur la facture font foi.",
        "La Commande est ferme lorsque le paiement est accepté par le prestataire (carte, Mobile Money ou autre moyen proposé). Un e-mail de confirmation et une facture sont adressés lorsque le service d'envoi est opérationnel. L'Abonnement est activé à réception de la confirmation de paiement (webhook ou vérification auprès du prestataire).",
        "La Société peut corriger une erreur manifeste de prix avant ou après Commande ; dans ce cas, l'Utilisateur peut demander l'annulation et le remboursement du montant payé.",
      ],
    },
    {
      title: "8. Paiement",
      paragraphs: [
        "Les moyens de paiement proposés dépendent du pays et de la devise de l'Utilisateur. Ils peuvent inclure, sans que cette liste soit exhaustive : Mobile Money (MTN, Orange, Wave, etc.) et carte bancaire (Visa, Mastercard) via pawaPay, ou tout autre prestataire que la Société choisit d'activer.",
        "Le paiement est traité par des prestataires tiers. L'Utilisateur accepte leurs conditions. La Société n'a pas accès aux données complètes de carte. Les frais éventuellement facturés par l'opérateur mobile, la banque ou le prestataire restent à la charge de l'Utilisateur.",
        "En cas de paiement refusé, frauduleux ou ultérieurement contesté (chargeback), la Société peut suspendre l'Abonnement et, le cas échéant, réclamer les sommes dues.",
        "Les devises disponibles sont notamment le franc CFA d'Afrique centrale (XAF), le franc CFA d'Afrique de l'Ouest (XOF) et le dollar américain (USD). Les conversions éventuellement affichées sont indicatives.",
      ],
    },
    {
      title: "9. Accès au Service (exécution)",
      paragraphs: [
        "L'Abonnement est un service numérique fourni immédiatement. L'accès au Contenu premium est ouvert dès validation du paiement, pour la durée achetée, sur les examens concernés.",
        "En poursuivant le paiement, l'Utilisateur demande expressément l'exécution immédiate du service et reconnaît que, conformément aux règles applicables aux contenus numériques, le droit de rétractation peut être limité dès lors que l'exécution a commencé.",
        "L'essai gratuit ne donne pas accès au Contenu premium. L'expiration de l'Abonnement met fin à cet accès, sans préjudice des données de résultats déjà générées, consultables selon les fonctionnalités encore ouvertes.",
      ],
    },
    {
      title: "10. Droit de rétractation et remboursement",
      paragraphs: [
        "Les conditions détaillées figurent dans les [Conditions de remboursement](/remboursement), qui font partie intégrante des présentes CGU.",
        "Sous réserve des dispositions légales impératives, l'Utilisateur dispose d'un délai de quarante-huit (48) heures à compter de la souscription pour demander la rétractation, à condition de n'avoir pas utilisé le Contenu premium au-delà de l'essai gratuit.",
        "La demande doit être adressée de manière claire (courriel, téléphone ou WhatsApp aux coordonnées de l'article 1). Le remboursement, s'il est dû, est effectué par le même moyen de paiement, dans un délai maximal de quatorze (14) jours.",
        "Aucun remboursement n'est dû en cas de partage de Compte, de fraude, de manquement grave aux CGU, ou lorsque le Contenu premium a été consommé.",
      ],
    },
    {
      title: "11. Propriété intellectuelle",
      paragraphs: [
        "L'ensemble des éléments du Service (textes, questions, barèmes, sons, visuels, logiciels, marques, logo Objectif TCF, méthodologie) est protégé. Ils restent la propriété de la Société ou de ses concédants.",
        "L'Abonnement confère un droit d'usage personnel, non exclusif, non cessible, limité à la durée de l'Abonnement. Toute reproduction, extraction massive, revente, mise à disposition publique ou entraînement de modèles d'intelligence artificielle à partir du contenu est interdite.",
        "Les productions de l'Utilisateur (rédactions, enregistrements oraux) restent sa propriété. L'Utilisateur concède à la Société une licence non exclusive, gratuite, pour les héberger, les corriger et améliorer le Service, dans le respect de la Politique de confidentialité.",
      ],
    },
    {
      title: "12. Obligations de l'Utilisateur",
      paragraphs: [
        "L'Utilisateur s'engage à :",
      ],
      list: [
        {
          text: "utiliser le Service conformément à sa destination pédagogique, de bonne foi ;",
        },
        {
          text: "ne pas contourner les contrôles d'accès, extraire le contenu par des moyens automatisés ni porter atteinte à la sécurité du Site ;",
        },
        {
          text: "ne pas publier de contenus illicites, diffamatoires, haineux ou portant atteinte aux droits de tiers dans la communauté ou la messagerie ;",
        },
        {
          text: "respecter les correcteurs, les autres candidats et le personnel de la Société ;",
        },
        {
          text: "disposer d'un équipement et d'une connexion internet adaptés (y compris microphone pour l'oral).",
        },
      ],
    },
    {
      title: "13. Disponibilité, maintenance et responsabilité",
      paragraphs: [
        "La Société s'efforce d'assurer un accès continu au Service, sous réserve des opérations de maintenance, des pannes des prestataires (hébergement, paiement, e-mail, stockage) et des cas de force majeure.",
        "Le Service est fourni « en l'état ». Les scores, feedbacks IA et indicateurs NCLC sont des outils d'entraînement : ils ne se substituent pas à un examen officiel ni à un conseil d'immigration.",
        "La responsabilité de la Société est limitée, toutes causes confondues, au montant de l'Abonnement payé par l'Utilisateur au cours des douze (12) derniers mois. Sont exclus les préjudices indirects (perte de chance à un examen, perte de dossier d'immigration, perte de données imputable à l'Utilisateur).",
        "Rien dans les présentes n'exclut la responsabilité en cas de dol, faute lourde, ou atteinte à l'intégrité physique, dans la limite des règles d'ordre public applicables.",
      ],
    },
    {
      title: "14. Données personnelles",
      paragraphs: [
        "Le traitement des données (compte, paiements, copies, enregistrements oraux, traces de connexion) est décrit dans la [Politique de confidentialité](/confidentialite).",
        "En utilisant le Service, l'Utilisateur est informé que des prestataires (hébergeur, paiement, e-mail, stockage de fichiers) peuvent traiter des données pour le compte de la Société, dans la limite de ce qui est nécessaire à l'exécution du contrat.",
      ],
    },
    {
      title: "15. Durée, résiliation et suppression",
      paragraphs: [
        "Le Compte est ouvert pour une durée indéterminée. L'Abonnement prend fin à l'échéance de la période payée, sauf reconduction lorsque celle-ci est expressément proposée et acceptée (par exemple via un prestataire de paiement par abonnement).",
        "L'Utilisateur peut demander la clôture de son Compte à tout moment en contactant la Société. La clôture n'emporte pas remboursement des périodes déjà commencées, sauf application de l'article 10.",
        "La Société peut résilier le Compte en cas de manquement, avec effet immédiat s'il s'agit d'un manquement grave. Les contenus illicites peuvent être retirés sans préavis.",
      ],
    },
    {
      title: "16. Modification des CGU",
      paragraphs: [
        "La Société peut modifier les CGU. La version à jour est publiée sur le Site avec sa date. Les modifications substantielles sont portées à la connaissance des Utilisateurs (bandeau, e-mail ou notification) lorsqu'elles affectent les Abonnements en cours.",
        "La poursuite de l'utilisation du Service après l'entrée en vigueur vaut acceptation, sauf pour les Utilisateurs qui clôturent leur Compte avant cette date.",
      ],
    },
    {
      title: "17. Droit applicable et litiges",
      paragraphs: [
        "Les présentes CGU sont régies par le droit camerounais, sous réserve des règles d'ordre public du pays de résidence de l'Utilisateur consommateur.",
        "En cas de litige, les parties s'efforcent de trouver une solution amiable. À défaut, les tribunaux compétents du ressort du siège de la Société seront saisis, sous réserve des règles impératives de compétence protectrices du consommateur.",
      ],
    },
    {
      title: "18. Contact",
      paragraphs: [
        "Pour toute question relative aux présentes CGU, à une Commande ou à un Abonnement :",
      ],
      list: [
        {
          text: `Courriel : [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: `Téléphone : [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `WhatsApp : [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
        { text: `Site : [${SITE_URL}](${SITE_URL})` },
      ],
    },
  ],
};
