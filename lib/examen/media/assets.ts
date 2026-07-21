/**
 * Médias gratuits pour la démo TCF (Unsplash — usage hotlink OK).
 * En production : héberger sur Cloudinary / S3 avec vos propres enregistrements.
 */

export const CO_MEDIA = [
  {
    documentType: "Annonce aéroport",
    imageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    audioScript:
      "Mesdames, messieurs, bienvenue à l'aéroport international Pierre-Elliott-Trudeau. Le vol Air Canada numéro cent vingt-trois à destination de Montréal embarque à la porte cinquante-deux. Départ prévu à quatorze heures trente. Les passagers en classe économique sont priés de présenter leurs cartes d'embarquement.",
  },
  {
    documentType: "Dialogue",
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    audioScript:
      "— Qu'est-ce que tu veux faire ce week-end ? — J'aimerais bien visiter le musée des beaux-arts, il y a une nouvelle exposition sur l'art inuit. — Bonne idée ! On y va samedi matin ? — Parfait, je réserve les billets en ligne.",
  },
  {
    documentType: "Annonce culturelle",
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    audioScript:
      "La ville de Montréal vous invite au grand concert en plein air au parc Lafontaine, ce samedi à dix-neuf heures. Entrée gratuite. Apportez votre couverture et profitez de la musique québécoise sous les étoiles.",
  },
  {
    documentType: "Interview radio",
    imageUrl:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
    audioScript:
      "Aujourd'hui, nous recevons le chef Martin Dubois, propriétaire du restaurant Le Plateau. Depuis quinze ans, il propose une cuisine québécoise moderne et travaille avec des producteurs locaux de la région de Charlevoix.",
  },
  {
    documentType: "Message vocal",
    imageUrl:
      "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&q=80",
    audioScript:
      "Bonjour docteur Tremblay, c'est Sophie Martin. Je suis désolée, je dois annuler mon rendez-vous de jeudi à quinze heures. Je vous rappellerai la semaine prochaine pour fixer une nouvelle date. Merci beaucoup, au revoir.",
  },
  {
    documentType: "Conversation",
    imageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
    audioScript:
      "— Comment on va au centre-ville ? — Le métro est en panne aujourd'hui. — Alors prenons le bus, la ligne quarante-cinq passe toutes les dix minutes. — D'accord, c'est plus simple et moins cher qu'un taxi.",
  },
  {
    documentType: "Bulletin météo",
    imageUrl:
      "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80",
    audioScript:
      "Bulletin météo pour Montréal et le sud du Québec : aujourd'hui, ensoleillé avec un maximum de moins cinq degrés. Demain, neige prévue en fin de journée avec dix à quinze centimètres accumulés. Prudence sur les routes.",
  },
  {
    documentType: "Annonce université",
    imageUrl:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    audioScript:
      "Attention étudiants : les inscriptions aux cours d'été sont ouvertes jusqu'au vendredi quinze mars. Rendez-vous sur le portail étudiant ou au bureau du registraire, pavillon principal, deuxième étage.",
  },
  {
    documentType: "Reportage",
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    audioScript:
      "Notre invité, M. Philippe Gagnon, directeur d'une agence de recrutement, explique que le marché de l'emploi au Québec reste dynamique dans les secteurs de la santé et des technologies. Les candidats bilingues sont particulièrement recherchés.",
  },
  {
    documentType: "Annonce gare",
    imageUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb7848bf2?w=800&q=80",
    audioScript:
      "Voyageurs attention : le train de dix-sept heures quarante-cinq à destination de Québec partira avec un retard de vingt minutes en raison de travaux sur la voie. Nous vous remercions de votre patience.",
  },
] as const;

export const CE_IMAGES = [
  "https://images.unsplash.com/photo-1524995995642-9614561771e5?w=800&q=80",
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  "https://images.unsplash.com/photo-1474487548417-781cb7848bf2?w=800&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
] as const;

export const CE_DOCUMENT_TAGS = [
  "Message",
  "Annonce",
  "Article",
  "Reportage",
  "Courriel",
  "Affiche",
  "Notice",
  "Offre d'emploi",
  "Communiqué",
  "Lettre",
] as const;

export const EO_PROMPT_SCRIPTS = [
  "Bonjour. Pour commencer, présentez-vous brièvement : d'où vous venez, votre parcours et votre projet au Canada.",
  "Nous allons discuter de l'immigration francophone au Canada. Quelle est votre opinion sur ce sujet ? Soyez précis dans vos arguments.",
  "Voici votre sujet : le télétravail, avantages et inconvénients pour la société canadienne. Vous avez quelques minutes pour préparer, puis vous développerez votre point de vue.",
] as const;

export function getCoMedia(order: number) {
  const idx = (order - 1) % CO_MEDIA.length;
  return CO_MEDIA[idx];
}

export function getCeImage(order: number) {
  return CE_IMAGES[(order - 1) % CE_IMAGES.length];
}

export function getCeDocumentTag(order: number) {
  return CE_DOCUMENT_TAGS[(order - 1) % CE_DOCUMENT_TAGS.length];
}

export function getEoPromptScript(taskOrder: number) {
  return EO_PROMPT_SCRIPTS[(taskOrder - 1) % EO_PROMPT_SCRIPTS.length];
}
