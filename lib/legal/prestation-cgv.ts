import type { LegalContent } from "@/lib/marketing/content/legal";
import { getClientConfig, getPrestataireConfig } from "@/lib/legal/prestation-config";

function contactLines(email: string, phone: string) {
  const items: { text: string }[] = [];
  if (email) items.push({ text: `Courriel : ${email}` });
  if (phone) items.push({ text: `Téléphone : ${phone}` });
  return items;
}

/** CGV de la prestation de développement — relation Prestataire / Client (pas les élèves). */
export function getPrestationCgv(): LegalContent {
  const p = getPrestataireConfig();
  const c = getClientConfig();
  const prestataireId = [
    p.legalName,
    `activité de programmation informatique / développement de sites et applications web (APE ${p.apeCode})`,
    p.siret ? `SIRET ${p.siret}` : "micro-entreprise immatriculée en France",
    "assujettie au régime de la franchise en base de TVA (article 293 B du CGI), sauf évolution ultérieure du régime fiscal",
  ].join(", ");

  return {
    title: "Conditions générales de vente — prestation de développement web",
    lastUpdated: "Dernière mise à jour : 15 août 2026",
    sections: [
      {
        title: "Préambule",
        paragraphs: [
          `Les présentes conditions générales de vente (ci-après les « CGV ») régissent exclusivement la relation entre le Prestataire ci-dessous et le Client, au titre de la conception, du développement et de la livraison de la plateforme Objectif TCF accessible à l'adresse ${c.website}.`,
          "Elles ne s'appliquent pas aux utilisateurs finaux de la plateforme (candidats, abonnés, correcteurs). Les conditions d'utilisation du site, la politique de confidentialité et les conditions de remboursement des abonnements sont des documents distincts, édités pour le compte du Client.",
          "Toute commande, tout paiement ou toute mise en production de la plateforme vaut acceptation des présentes CGV par le Client.",
        ],
      },
      {
        title: "1. Parties",
        paragraphs: [
          `Le Prestataire : ${prestataireId}.`,
        ],
        list: contactLines(p.email, p.phone),
        paragraphsAfterList: [
          `Le Client : ${c.legalName}, exploitant le service sous le nom commercial ${c.tradeName}, éditeur du site ${c.website}.`,
        ],
        listAfterParagraphs: contactLines(c.email, ""),
      },
      {
        title: "2. Objet",
        paragraphs: [
          "Le Prestataire réalise, pour le Client, une prestation de développement informatique sur devis, consistant à livrer une application web opérationnelle permettant la préparation en ligne aux examens TCF Canada, TEF Canada et IELTS (ci-après le « Projet »).",
          "Les présentes CGV, le devis accepté et, le cas échéant, la facture, forment le contrat. En cas de contradiction, le devis signé prévaut sur les CGV pour le prix et le périmètre chiffré ; les CGV prévalent pour les garanties, la propriété intellectuelle et la responsabilité.",
        ],
      },
      {
        title: "3. Périmètre de la prestation",
        paragraphs: [
          "Sauf avenant écrit, le forfait comprend la livraison du Projet tel que développé, notamment :",
        ],
        list: [
          {
            text: "site vitrine et pages marketing (accueil, offres, FAQ, contact, contenus légaux) ;",
          },
          {
            text: "espace candidat : inscription, connexion, Google OAuth, onboarding, tableau de bord, séries, examens (CO, CE, EE, EO), résultats, documents, communauté, messagerie, paramètres ;",
          },
          {
            text: "espace administrateur : utilisateurs, offres et tarifs, paiements, examens et séries, correcteurs, communauté, statistiques ;",
          },
          {
            text: "espace correcteur ;",
          },
          {
            text: "paiements en ligne (intégration Mobile Money / pawaPay), factures, gestion des abonnements ;",
          },
          {
            text: "hébergement du code sur le dépôt et déploiement sur l'infrastructure choisie (Vercel), base de données PostgreSQL, stockage de fichiers.",
          },
        ],
        paragraphsAfterList: [
          "Ne sont pas inclus dans le forfait, sauf mention contraire au devis : la rédaction du contenu pédagogique (banque de questions, audio, barèmes officiels), l'achat de noms de domaine, les abonnements aux prestataires tiers (Vercel, Neon, pawaPay, Resend, Google Cloud, etc.), le community management, le support utilisateurs au quotidien, les évolutions fonctionnelles demandées après recette, et toute prestation de conseil en immigration ou en pédagogie des examens.",
        ],
      },
      {
        title: "4. Prix et paiement",
        paragraphs: [
          `Le prix de la prestation objet des présentes est un forfait de ${p.amountCad} $ CA (dollars canadiens). TVA non applicable, article 293 B du CGI (franchise en base).`,
          `Le Client a réglé l'intégralité du prix par ${p.paymentMethod}. Le paiement a été reçu par le Prestataire. En conséquence, le transfert des droits prévu à l'article 8 est acquis.`,
          "Tout retard de paiement peut entraîner la suspension de l'accès aux livrables, aux déploiements ou au support, après mise en demeure restée infructueuse pendant huit (8) jours. Des pénalités de retard au taux légal en vigueur et une indemnité forfaitaire de recouvrement de 40 € sont applicables aux Clients professionnels, conformément au code de commerce.",
          "Les frais des services tiers (hébergement, e-mail, paiements, noms de domaine) sont à la charge exclusive du Client, facturés directement par ces prestataires.",
        ],
      },
      {
        title: "5. Délais, livraison et recette",
        paragraphs: [
          `Le délai de réalisation convenu est de ${p.durationWeeks} semaines à compter du démarrage effectif de la prestation. Les délais indiqués au devis sont indicatifs, sauf mention d'un délai de rigueur. Ils courent à compter de la réception des éléments nécessaires (accès comptes, contenus, validations, secrets d'API).`,
          "La livraison consiste en la mise à disposition du Projet en environnement de production convenu (notamment https://objectif-tcf.org) et/ou la remise de l'accès au dépôt de code.",
          "Le Client dispose d'un délai de quinze (15) jours calendaires à compter de la notification de livraison pour formuler des réserves écrites et motivées (anomalies reproductibles par rapport au périmètre de l'article 3). Passé ce délai sans réserve, la recette est réputée tacite et le Projet accepté.",
          "Les demandes d'évolution (fonctionnalités nouvelles, refontes graphiques, nouveaux prestataires de paiement, etc.) font l'objet d'un devis séparé et ne constituent pas des réserves de recette.",
        ],
      },
      {
        title: "6. Obligations du Prestataire",
        paragraphs: [
          "Le Prestataire s'engage à exécuter la prestation avec diligence, conformément aux règles de l'art du développement web, et à livrer un Projet fonctionnel au regard du périmètre convenu.",
          "Le Prestataire n'est tenu qu'à une obligation de moyens, et non de résultat, s'agissant des performances commerciales du site, du nombre d'inscriptions, des scores des candidats aux examens officiels, ou de la disponibilité des API de tiers.",
          "Le Prestataire informe le Client des prérequis techniques (comptes Vercel, base de données, clés de paiement, OAuth, e-mail, nom de domaine) nécessaires à la mise en production et à l'exploitation.",
        ],
      },
      {
        title: "7. Obligations du Client",
        paragraphs: [
          "Le Client s'engage à :",
        ],
        list: [
          {
            text: "fournir à temps les accès, contenus, mentions légales, tarifs et informations d'identité de son entreprise ;",
          },
          {
            text: "créer et conserver sous son contrôle les comptes des prestataires tiers (hébergeur, paiement, e-mail, Google Cloud, noms de domaine) ;",
          },
          {
            text: "vérifier le Projet lors de la recette et signaler les anomalies dans le délai de l'article 5 ;",
          },
          {
            text: "exploiter le site dans le respect des lois applicables (consommation, données personnelles, droit des examens, obligations fiscales et comptables) ;",
          },
          {
            text: "régler le prix aux échéances convenues.",
          },
        ],
        paragraphsAfterList: [
          "Le Client reste seul responsable du contenu pédagogique publié, des communications commerciales (taux de réussite, « C2 », etc.), des relations avec ses abonnés et de la conformité de ses CGU / politique de confidentialité vis-à-vis des utilisateurs finaux.",
        ],
      },
      {
        title: "8. Propriété intellectuelle",
        paragraphs: [
          "Le Prestataire reste titulaire des méthodes, savoir-faire, composants génériques et outils qu'il utilise habituellement. Le Client n'acquiert aucun droit sur ces éléments indépendamment du Projet.",
          "Sous réserve du paiement intégral du prix, le Prestataire cède au Client, pour la durée des droits patrimoniaux et pour le monde entier, les droits d'utilisation, de reproduction, de représentation, d'adaptation et d'exploitation du code et des livrables spécifiquement réalisés pour le Projet, afin d'exploiter, maintenir et faire évoluer la plateforme Objectif TCF.",
          "Les éléments fournis par le Client (textes, logos, visuels, banque de questions, enregistrements) restent sa propriété. Les bibliothèques open-source conservent leurs licences respectives.",
          "Tant que le prix n'est pas intégralement payé, le Prestataire peut restreindre l'accès au dépôt ou à l'environnement de production.",
        ],
      },
      {
        title: "9. Garantie des anomalies",
        paragraphs: [
          "Pendant trente (30) jours à compter de la recette (expresse ou tacite), le Prestataire corrige, sans surcoût, les anomalies reproductibles qui empêchent l'usage normal d'une fonctionnalité comprise dans le périmètre de l'article 3, à condition qu'elles ne résultent pas d'une modification faite par un tiers, d'un mauvais paramétrage des comptes Client, d'une panne d'un prestataire tiers, ou d'un usage non conforme.",
          "Au-delà de ce délai, toute intervention (correctif, assistance, évolution) est facturée sur devis ou au temps passé, selon accord écrit.",
          "La garantie ne couvre pas les pertes de données imputables au Client, les changements de politique des prestataires (pawaPay, Google, Vercel, etc.), ni les conséquences d'un non-renouvellement des abonnements d'infrastructure.",
        ],
      },
      {
        title: "10. Maintenance et évolutions",
        paragraphs: [
          "Aucune maintenance corrective, évolutive ou infogérance n'est incluse dans le forfait après la période de garantie, sauf contrat de maintenance distinct.",
          "Les demandes d'évolution (nouvelles pages, nouveaux moyens de paiement, applications mobiles, refonte, traductions supplémentaires, etc.) font l'objet d'un devis accepté avant réalisation.",
        ],
      },
      {
        title: "11. Hébergement, noms de domaine et services tiers",
        paragraphs: [
          "Le Client est titulaire des contrats d'hébergement, de nom de domaine, de base de données, d'envoi d'e-mails, de paiement et d'authentification. Il en assume les coûts, les obligations de sécurité et les relations avec ces prestataires.",
          "Le Prestataire n'est pas responsable des interruptions, changements de tarifs, refus de compte ou pannes de Vercel, Neon, pawaPay, Google, Resend ou de tout autre tiers.",
          "Les clés API, mots de passe et secrets restent sous la responsabilité du Client dès leur communication ou leur dépôt dans son tableau de bord (Vercel, Google Cloud, etc.).",
        ],
      },
      {
        title: "12. Responsabilité",
        paragraphs: [
          "La responsabilité du Prestataire est limitée aux dommages directs et prévisibles résultant d'une faute prouvée dans l'exécution de la prestation. Sont exclus les préjudices indirects (perte de chiffre d'affaires, perte de chance, atteinte à l'image, perte de données, échec d'un candidat à un examen officiel).",
          `Toutes causes confondues, l'indemnisation éventuellement due par le Prestataire ne peut excéder le montant HT effectivement encaissé au titre du Projet (soit ${p.amountCad} $ CA, sauf avenant).`,
          "Le Prestataire n'est pas l'éditeur du service éducatif vis-à-vis des utilisateurs finaux. Il n'est pas responsable du contenu pédagogique, des résultats d'examen, des encaissements d'abonnements du Client, ni des litiges entre le Client et ses utilisateurs.",
        ],
      },
      {
        title: "13. Confidentialité et données",
        paragraphs: [
          "Chaque partie s'engage à ne pas divulguer les informations confidentielles de l'autre (code non public, secrets d'API, données personnelles des utilisateurs, conditions financières) pendant la durée du contrat et trois (3) ans ensuite, sauf obligation légale.",
          "Le Client est responsable de traitement des données personnelles collectées par la plateforme. Le Prestataire n'intervient qu'en qualité de sous-traitant technique pendant le développement et, le cas échéant, les interventions de maintenance expressément demandées.",
        ],
      },
      {
        title: "14. Références",
        paragraphs: [
          "Sauf opposition écrite du Client, le Prestataire peut citer le Projet (nom Objectif TCF, URL, captures d'écran non confidentielles) à titre de référence professionnelle (portfolio, devis, réseaux).",
        ],
      },
      {
        title: "15. Résiliation",
        paragraphs: [
          "En cas de manquement grave d'une partie aux présentes, non réparé dans les quinze (15) jours d'une mise en demeure écrite, l'autre partie peut résilier le contrat.",
          "En cas de résiliation du fait du Client avant livraison, les sommes correspondant au travail déjà réalisé restent dues, sur justificatif, sans pouvoir être inférieures à l'acompte éventuellement versé.",
          "La résiliation n'entraîne pas le transfert des droits de l'article 8 si le prix n'est pas intégralement payé.",
        ],
      },
      {
        title: "16. Droit applicable et litiges",
        paragraphs: [
          "Les présentes CGV sont régies par le droit français.",
          "En cas de litige, les parties s'efforcent de trouver une solution amiable. À défaut, les tribunaux compétents du ressort du domicile du Prestataire seront seuls compétents, y compris en cas de pluralité de défendeurs, pour les litiges entre professionnels.",
        ],
      },
      {
        title: "17. Acceptation",
        paragraphs: [
          "Les présentes CGV sont mises à disposition du Client dans l'espace d'administration du Projet (Documents) au format PDF. Leur consultation, leur téléchargement, le paiement de la facture ou la mise en production du site valent acceptation.",
          "Toute modification des CGV sera notifiée au Client. Elle s'applique aux prestations postérieures, sauf avenant visant une prestation déjà livrée.",
        ],
      },
    ],
  };
}
