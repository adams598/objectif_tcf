/**
 * Banque de contenu TCF Canada — Série 100
 * Questions inspirées des formats officiels (FEI / CIEP) et ressources pédagogiques publiques.
 * Sources : manuel candidat TCF Canada, exemples GlobalExam, Canatef, FormationsTCFCanada.
 */

import {
  FREE_SERIES_ORDERS,
  PREMIUM_SERIES_ORDERS,
} from "@/lib/preparation/series-catalog";
import {
  buildCeQuestionPool,
  buildCoQuestionPool,
  selectQcmFromPool,
} from "./tcf-qcm-pool";

export interface BankChoice {
  content: string;
  isCorrect: boolean;
}

export interface BankQuestion {
  order: number;
  type: "QCM" | "WRITING_TASK" | "SPEAKING_TASK";
  content: string;
  instruction?: string;
  audioUrl?: string;
  imageUrl?: string;
  choices?: BankChoice[];
  explanation?: string;
  /** JSON pour EE/EO : minWords, maxWords, preparationTime, speakingTime */
  meta?: Record<string, number | string>;
}

export interface BankSeries {
  order: number;
  skill:
    | "COMPREHENSION_ORALE"
    | "COMPREHENSION_ECRITE"
    | "EXPRESSION_ECRITE"
    | "EXPRESSION_ORALE";
  title: string;
  description: string;
  durationMin: number;
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  isFree: boolean;
  questions: BankQuestion[];
}

const coQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "QCM",
    instruction: "Écoutez le document sonore et la question.",
    content: "À quelle heure décolle le vol Air Canada 123 à destination de Montréal ?",
    choices: [
      { content: "13 h 30", isCorrect: false },
      { content: "14 h 30", isCorrect: true },
      { content: "15 h 30", isCorrect: false },
      { content: "16 h 30", isCorrect: false },
    ],
    explanation:
      "Annonce aéroport — repérer l'heure exacte dans le message (format TCF CO type annonce).",
  },
  {
    order: 2,
    type: "QCM",
    instruction: "Écoutez le dialogue.",
    content: "Que veut faire la femme ce week-end ?",
    choices: [
      { content: "Aller au cinéma", isCorrect: false },
      { content: "Visiter un musée", isCorrect: true },
      { content: "Faire du shopping", isCorrect: false },
      { content: "Rester à la maison", isCorrect: false },
    ],
    explanation: "Dialogue quotidien — identifier l'intention du locuteur.",
  },
  {
    order: 3,
    type: "QCM",
    instruction: "Écoutez l'annonce.",
    content: "Où se déroule le concert annoncé ?",
    choices: [
      { content: "À la bibliothèque", isCorrect: false },
      { content: "Au parc Lafontaine", isCorrect: true },
      { content: "À l'université", isCorrect: false },
      { content: "Au centre commercial", isCorrect: false },
    ],
    explanation: "Annonce culturelle — repérer le lieu.",
  },
  {
    order: 4,
    type: "QCM",
    instruction: "Écoutez l'interview.",
    content: "Quel est le métier de l'invité ?",
    choices: [
      { content: "Médecin", isCorrect: false },
      { content: "Journaliste", isCorrect: false },
      { content: "Chef cuisinier", isCorrect: true },
      { content: "Professeur", isCorrect: false },
    ],
    explanation: "Interview radio — identifier la profession mentionnée.",
  },
  {
    order: 5,
    type: "QCM",
    instruction: "Écoutez le message vocal.",
    content: "Pourquoi la personne appelle-t-elle ?",
    choices: [
      { content: "Pour annuler un rendez-vous", isCorrect: true },
      { content: "Pour confirmer une commande", isCorrect: false },
      { content: "Pour demander une facture", isCorrect: false },
      { content: "Pour s'inscrire à un cours", isCorrect: false },
    ],
    explanation: "Message téléphonique — comprendre l'objectif de l'appel.",
  },
  {
    order: 6,
    type: "QCM",
    instruction: "Écoutez la conversation.",
    content: "Quel moyen de transport les interlocuteurs choisissent-ils ?",
    choices: [
      { content: "Le métro", isCorrect: false },
      { content: "Le bus", isCorrect: true },
      { content: "Le taxi", isCorrect: false },
      { content: "Le vélo", isCorrect: false },
    ],
    explanation: "Conversation pratique — détail concret du dialogue.",
  },
  {
    order: 7,
    type: "QCM",
    instruction: "Écoutez le reportage.",
    content: "De quoi parle principalement ce reportage ?",
    choices: [
      { content: "Du changement climatique au Québec", isCorrect: true },
      { content: "D'une élection municipale", isCorrect: false },
      { content: "D'un festival de musique", isCorrect: false },
      { content: "D'une grève des transports", isCorrect: false },
    ],
    explanation: "Reportage — thème global du document.",
  },
  {
    order: 8,
    type: "QCM",
    instruction: "Écoutez l'extrait.",
    content: "Quelle est l'attitude du locuteur envers le télétravail ?",
    choices: [
      { content: "Il le rejette totalement", isCorrect: false },
      { content: "Il y est favorable avec des réserves", isCorrect: true },
      { content: "Il n'exprime aucune opinion", isCorrect: false },
      { content: "Il le considère impossible", isCorrect: false },
    ],
    explanation: "Opinion nuancée — repérer les marqueurs d'attitude.",
  },
  {
    order: 9,
    type: "QCM",
    instruction: "Écoutez la description.",
    content: "Combien coûte l'entrée au spectacle ?",
    choices: [
      { content: "Gratuite", isCorrect: false },
      { content: "10 dollars", isCorrect: false },
      { content: "15 dollars", isCorrect: true },
      { content: "25 dollars", isCorrect: false },
    ],
    explanation: "Information chiffrée — prix dans l'annonce.",
  },
  {
    order: 10,
    type: "QCM",
    instruction: "Écoutez le dialogue.",
    content: "Quel problème rencontre le client ?",
    choices: [
      { content: "Sa commande est en retard", isCorrect: true },
      { content: "Il a perdu sa carte", isCorrect: false },
      { content: "Le magasin est fermé", isCorrect: false },
      { content: "Le produit est en solde", isCorrect: false },
    ],
    explanation: "Situation de service client — problème principal.",
  },
];

const ceQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "QCM",
    instruction: `Chers collègues,

Nous vous informons que la réunion parents-professeurs des classes de seconde prévue pour ce samedi est reportée au samedi prochain à midi. Votre présence est obligatoire.

La direction du lycée`,
    content: "À qui est adressé ce message ?",
    choices: [
      { content: "Aux élèves", isCorrect: false },
      { content: "Aux étudiants", isCorrect: false },
      { content: "Aux parents", isCorrect: false },
      { content: "Aux professeurs", isCorrect: true },
    ],
    explanation: "Formule « Chers collègues » + contexte scolaire → personnel enseignant.",
  },
  {
    order: 2,
    type: "QCM",
    instruction: `La bibliothèque municipale de Montréal ouvre gratuitement tous les dimanches de 10 h à 18 h. Ateliers de lecture pour enfants à 14 h. Inscription sur place.`,
    content: "Que propose la bibliothèque le dimanche ?",
    choices: [
      { content: "Des cours de français gratuits", isCorrect: false },
      { content: "Des ateliers de lecture pour enfants", isCorrect: true },
      { content: "Une exposition d'art contemporain", isCorrect: false },
      { content: "Un concours de poésie", isCorrect: false },
    ],
    explanation: "Lecture ciblée — activité explicitement mentionnée.",
  },
  {
    order: 3,
    type: "QCM",
    instruction: `Au Canada, le télétravail s'est généralisé depuis 2020. Selon Statistique Canada, près de 35 % des employés travaillent en mode hybride. Le gouvernement fédéral étudie un droit à la déconnexion.`,
    content: "Quel pourcentage d'employés canadiens travaille en mode hybride ?",
    choices: [
      { content: "15 %", isCorrect: false },
      { content: "25 %", isCorrect: false },
      { content: "35 %", isCorrect: true },
      { content: "45 %", isCorrect: false },
    ],
    explanation: "Donnée chiffrée explicite dans le texte.",
  },
  {
    order: 4,
    type: "QCM",
    instruction: `Montréal attire chaque année des dizaines de milliers de nouveaux arrivants francophones. Le Programme de l'expérience québécoise (PEQ) favorise l'intégration des candidats qualifiés maîtrisant le français.`,
    content: "Quel programme favorise l'intégration des francophones qualifiés ?",
    choices: [
      { content: "Le Programme express", isCorrect: false },
      { content: "Le PEQ", isCorrect: true },
      { content: "Le PVT", isCorrect: false },
      { content: "Le CSQ", isCorrect: false },
    ],
    explanation: "Sigle PEQ mentionné dans le document.",
  },
  {
    order: 5,
    type: "QCM",
    instruction: `Objet : Réunion d'équipe

Bonjour à tous,

La réunion hebdomadaire aura lieu mardi à 9 h en salle 204. Ordre du jour : bilan des ventes et planification du trimestre.

Cordialement,
Marie, responsable RH`,
    content: "Quel est l'objet principal de la réunion ?",
    choices: [
      { content: "Accueillir un nouveau collègue", isCorrect: false },
      { content: "Faire le bilan des ventes", isCorrect: true },
      { content: "Organiser une fête", isCorrect: false },
      { content: "Former le personnel", isCorrect: false },
    ],
    explanation: "Ordre du jour explicite dans le courriel professionnel.",
  },
  {
    order: 6,
    type: "QCM",
    instruction: `ATTENTION : Travaux sur la ligne orange du métro ce week-end. Service interrompu entre Berri-UQAM et Jean-Talon. Bus de remplacement disponibles.`,
    content: "Quel transport est concerné par les travaux ?",
    choices: [
      { content: "Le train de banlieue", isCorrect: false },
      { content: "Le métro", isCorrect: true },
      { content: "Le tramway", isCorrect: false },
      { content: "Le ferry", isCorrect: false },
    ],
    explanation: "Annonce STM — ligne orange = métro.",
  },
  {
    order: 7,
    type: "QCM",
    instruction: `Pour obtenir la citoyenneté canadienne, les candidats doivent démontrer une connaissance suffisante du français ou de l'anglais, selon la province de résidence. Un test comme le TCF Canada est reconnu par IRCC.`,
    content: "Que doit démontrer un candidat à la citoyenneté ?",
    choices: [
      { content: "Une connaissance de l'histoire uniquement", isCorrect: false },
      { content: "Une maîtrise d'une langue officielle", isCorrect: true },
      { content: "Un diplôme universitaire", isCorrect: false },
      { content: "Cinq ans d'expérience professionnelle", isCorrect: false },
    ],
    explanation: "Exigence linguistique pour la citoyenneté.",
  },
  {
    order: 8,
    type: "QCM",
    instruction: `Offre d'emploi — Serveur(se) recherché(e) pour restaurant au centre-ville. Expérience exigée. Horaires soir et week-end. Salaire compétitif + pourboires.`,
    content: "Quelle expérience est demandée ?",
    choices: [
      { content: "Aucune", isCorrect: false },
      { content: "En restauration", isCorrect: true },
      { content: "En informatique", isCorrect: false },
      { content: "En vente automobile", isCorrect: false },
    ],
    explanation: "Poste de serveur — expérience en restauration implicite.",
  },
  {
    order: 9,
    type: "QCM",
    instruction: `Le Québec accueille le Sommet de la francophonie économique la semaine prochaine. Des délégations de vingt pays participeront à des conférences sur l'innovation et l'immigration qualifiée.`,
    content: "Quel est le thème principal du sommet ?",
    choices: [
      { content: "Le tourisme hivernal", isCorrect: false },
      { content: "La francophonie économique", isCorrect: true },
      { content: "La cuisine québécoise", isCorrect: false },
      { content: "Le sport amateur", isCorrect: false },
    ],
    explanation: "Titre et contenu de l'article — francophonie économique.",
  },
  {
    order: 10,
    type: "QCM",
    instruction: `Madame, Monsieur,

Suite à votre candidature, nous avons le plaisir de vous convier à un entretien le 15 mars à 14 h au bureau de Toronto. Merci de confirmer votre présence par courriel.

Service des ressources humaines`,
    content: "Que doit faire le destinataire ?",
    choices: [
      { content: "Envoyer son CV", isCorrect: false },
      { content: "Confirmer sa présence", isCorrect: true },
      { content: "Annuler l'entretien", isCorrect: false },
      { content: "Payer des frais d'inscription", isCorrect: false },
    ],
    explanation: "Demande explicite de confirmation par courriel.",
  },
];

const eeQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "WRITING_TASK",
    content:
      "Écrivez un courriel à votre ami pour l'inviter à passer une journée avec vous (lieu, date, activités, etc.).",
    meta: { minWords: 60, maxWords: 120 },
    explanation: "Tâche 1 TCF — message personnel, registre semi-formel ou familier.",
  },
  {
    order: 2,
    type: "WRITING_TASK",
    content:
      "Vous partez en voyage dans quelques jours. Vous écrivez sur votre blog pour vos amis. Racontez votre projet de voyage (destination, durée, itinéraires, activités).",
    meta: { minWords: 120, maxWords: 150 },
    explanation: "Tâche 2 TCF — récit/blog, structure intro-développement-conclusion.",
  },
  {
    order: 3,
    type: "WRITING_TASK",
    content: `Document A : « Le télétravail améliore l'équilibre vie professionnelle / vie personnelle. »
Document B : « Le télétravail isole les employés et nuit à la cohésion d'équipe. »
Rédigez un article comparant ces deux points de vue et exprimez votre position personnelle.`,
    meta: { minWords: 120, maxWords: 180 },
    explanation: "Tâche 3 TCF — synthèse + prise de position argumentée.",
  },
];

const eoQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "SPEAKING_TASK",
    content: "Présentez-vous en 2 minutes.",
    instruction:
      "Entretien dirigé — parlez de vous : origine, parcours, projet au Canada.",
    meta: { preparationTime: 0, speakingTime: 120 },
    explanation: "Tâche 1 EO TCF — présentation structurée sans préparation longue.",
  },
  {
    order: 2,
    type: "SPEAKING_TASK",
    content:
      "Sujet : L'immigration francophone au Canada. Exprimez votre opinion et répondez aux questions de l'examinateur.",
    instruction: "Interaction — défendez votre point de vue avec des arguments précis.",
    meta: { preparationTime: 180, speakingTime: 180 },
    explanation: "Tâche 2 EO — interaction / débat.",
  },
  {
    order: 3,
    type: "SPEAKING_TASK",
    content:
      "Le télétravail : avantages et inconvénients pour la société canadienne. Développez une argumentation structurée.",
    instruction: "Expression d'un point de vue — 4 minutes de parole.",
    meta: { preparationTime: 240, speakingTime: 240 },
    explanation: "Tâche 3 EO — argumentation sur un thème de société.",
  },
];

const CO_POOL = buildCoQuestionPool(coQuestions);
const CE_POOL = buildCeQuestionPool(ceQuestions);

function expandQcm(base: BankQuestion[], targetCount: number): BankQuestion[] {
  const result: BankQuestion[] = [];
  for (let i = 0; i < targetCount; i++) {
    const src = base[i % base.length];
    result.push({
      ...src,
      order: i + 1,
      content:
        i >= base.length
          ? `[${i + 1}] ${src.content}`
          : src.content,
    });
  }
  return result;
}

export const TCF_SERIE_100_BANK: BankSeries[] = [
  {
    order: 100,
    skill: "COMPREHENSION_ORALE",
    title: "Série 100 — Compréhension orale",
    description: "Entraînement CO TCF Canada — 39 QCM (banque initialisée)",
    durationMin: 40,
    difficulty: "B1",
    isFree: true,
    questions: selectQcmFromPool(CO_POOL, 39, 100),
  },
  {
    order: 100,
    skill: "COMPREHENSION_ECRITE",
    title: "Série 100 — Compréhension écrite",
    description: "Entraînement CE TCF Canada — 39 QCM",
    durationMin: 60,
    difficulty: "B1",
    isFree: true,
    questions: selectQcmFromPool(CE_POOL, 39, 100),
  },
  {
    order: 100,
    skill: "EXPRESSION_ECRITE",
    title: "Série 100 — Expression écrite",
    description: "3 tâches d'expression écrite TCF Canada",
    durationMin: 60,
    difficulty: "B2",
    isFree: true,
    questions: eeQuestions,
  },
  {
    order: 100,
    skill: "EXPRESSION_ORALE",
    title: "Série 100 — Expression orale",
    description: "3 tâches d'expression orale TCF Canada",
    durationMin: 12,
    difficulty: "B2",
    isFree: true,
    questions: eoQuestions,
  },
];

export function getAllTcfCanadaBankSeries(): BankSeries[] {
  const freeSeries = FREE_SERIES_ORDERS.flatMap((order) =>
    TCF_SERIE_100_BANK.map((s) => ({
      ...s,
      order,
      title: s.title.replace("100", String(order)),
      questions: s.questions.map((q) => ({ ...q, order: q.order })),
    }))
  );

  const premium = PREMIUM_SERIES_ORDERS.flatMap((order) =>
    TCF_SERIE_100_BANK.map((s) => ({
      ...s,
      order,
      title: s.title.replace("100", String(order)),
      isFree: false,
      questions:
        s.skill === "COMPREHENSION_ORALE"
          ? selectQcmFromPool(CO_POOL, 39, order)
          : s.skill === "COMPREHENSION_ECRITE"
            ? selectQcmFromPool(CE_POOL, 39, order)
            : s.questions.map((q, index) => ({ ...q, order: index + 1 })),
    }))
  );
  return [...freeSeries, ...premium];
}
