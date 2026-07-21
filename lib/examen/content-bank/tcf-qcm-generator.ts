import type { BankQuestion } from "./tcf-canada";

const TARGET_CO = 750;
const TARGET_CE = 750;

interface QcmDraft {
  instruction: string;
  content: string;
  correct: string;
  wrong: [string, string, string];
  explanation: string;
}

const CO_CITIES = [
  "Montréal",
  "Québec",
  "Laval",
  "Gatineau",
  "Sherbrooke",
  "Trois-Rivières",
  "Saguenay",
  "Ottawa",
  "Toronto",
  "Vancouver",
];

const CO_HOURS = [
  "6 h 45",
  "7 h 30",
  "8 h 15",
  "9 h 00",
  "10 h 30",
  "11 h 45",
  "13 h 00",
  "14 h 20",
  "15 h 50",
  "16 h 10",
  "17 h 35",
  "18 h 00",
  "19 h 25",
  "20 h 40",
  "21 h 15",
];

const CO_TRANSPORT_MODES = [
  "train",
  "autobus",
  "métro",
  "navette",
  "tramway",
];

const CO_TRANSPORT_ISSUES = [
  "retardé de vingt minutes",
  "annulé pour cause de maintenance",
  "reporté au créneau suivant",
  "dévié vers une autre voie",
  "complet — prochain départ dans une heure",
];

const CO_WEATHER = [
  "fortes chutes de neige",
  "pluie verglaçante",
  "vent violent",
  "canicule",
  "brouillard dense",
];

const CO_HEALTH_ACTIONS = [
  "prendre rendez-vous en ligne",
  "jeûner douze heures avant l'analyse",
  "apporter la carte d'assurance maladie",
  "arriver quinze minutes en avance",
  "contacter le service de garde",
];

const CO_JOB_TOPICS = [
  "télétravail hybride",
  "stage en entreprise",
  "formation interne",
  "entretien d'embauche",
  "horaires flexibles",
];

const CO_SHOP_PROMOS = [
  "réduction de 20 % sur les livres",
  "livraison gratuite dès 50 $",
  "échange possible sous quinze jours",
  "soldes de fin de saison",
  "carte fidélité offerte",
];

const CO_LISTENING_FORMATS = [
  "l'annonce",
  "le message vocal",
  "le dialogue",
  "l'interview",
  "le bulletin météo",
  "le reportage",
  "la publicité",
  "l'extrait radio",
];

function draftToQuestion(draft: QcmDraft, order: number): BankQuestion {
  return {
    order,
    type: "QCM",
    instruction: draft.instruction,
    content: draft.content,
    choices: [
      { content: draft.wrong[0], isCorrect: false },
      { content: draft.correct, isCorrect: true },
      { content: draft.wrong[1], isCorrect: false },
      { content: draft.wrong[2], isCorrect: false },
    ],
    explanation: draft.explanation,
  };
}

function buildCoTransportDraft(index: number): QcmDraft {
  const city = CO_CITIES[index % CO_CITIES.length];
  const hour = CO_HOURS[Math.floor(index / CO_CITIES.length) % CO_HOURS.length];
  const mode = CO_TRANSPORT_MODES[Math.floor(index / (CO_CITIES.length * CO_HOURS.length)) % CO_TRANSPORT_MODES.length];
  const issue = CO_TRANSPORT_ISSUES[index % CO_TRANSPORT_ISSUES.length];
  const format = CO_LISTENING_FORMATS[index % CO_LISTENING_FORMATS.length];

  return {
    instruction: `Écoutez ${format} à ${city}. Le ${mode} de ${hour} est ${issue}.`,
    content: `Quelle est la situation du ${mode} de ${hour} ?`,
    correct: issue.charAt(0).toUpperCase() + issue.slice(1),
    wrong: [
      "À l'heure prévue sans changement",
      "Avancé de dix minutes",
      "Remplacé par un taxi collectif",
    ],
    explanation: "Annonce transport — repérer la modification annoncée.",
  };
}

function buildCoWeatherDraft(index: number): QcmDraft {
  const city = CO_CITIES[index % CO_CITIES.length];
  const weather = CO_WEATHER[Math.floor(index / CO_CITIES.length) % CO_WEATHER.length];
  const dayOffset = (index % 3) + 1;
  const dayLabel = dayOffset === 1 ? "demain" : `dans ${dayOffset} jours`;

  return {
    instruction: `Écoutez le bulletin météo pour ${city}. ${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, on prévoit ${weather}.`,
    content: `Quel temps est annoncé ${dayLabel} à ${city} ?`,
    correct: weather.charAt(0).toUpperCase() + weather.slice(1),
    wrong: ["Du soleil toute la journée", "Un temps sec et stable", "Une amélioration immédiate"],
    explanation: "Bulletin météo — condition annoncée pour la période indiquée.",
  };
}

function buildCoHealthDraft(index: number): QcmDraft {
  const action = CO_HEALTH_ACTIONS[index % CO_HEALTH_ACTIONS.length];
  const clinic = ["CLSC", "centre médical", "clinique sans rendez-vous"][index % 3];

  return {
    instruction: `Écoutez le message du ${clinic}. On demande au patient de ${action}.`,
    content: "Que doit faire le patient ?",
    correct: action.charAt(0).toUpperCase() + action.slice(1),
    wrong: [
      "Annuler sa consultation",
      "Se présenter sans pièce d'identité",
      "Payer en espèces uniquement",
    ],
    explanation: "Consigne médicale — action explicitement demandée.",
  };
}

function buildCoWorkDraft(index: number): QcmDraft {
  const topic = CO_JOB_TOPICS[index % CO_JOB_TOPICS.length];
  const company = ["la PME locale", "l'agence de placement", "le service RH", "le cabinet de recrutement"][index % 4];

  return {
    instruction: `Écoutez l'entretien avec ${company}. La discussion porte sur ${topic}.`,
    content: "Quel sujet est abordé dans l'entretien ?",
    correct: topic.charAt(0).toUpperCase() + topic.slice(1),
    wrong: ["Les vacances annuelles", "La cantine d'entreprise", "Le stationnement réservé"],
    explanation: "Entretien professionnel — thème principal du dialogue.",
  };
}

function buildCoShopDraft(index: number): QcmDraft {
  const promo = CO_SHOP_PROMOS[index % CO_SHOP_PROMOS.length];
  const store = ["librairie", "magasin électronique", "boutique de vêtements", "épicerie"][index % 4];

  return {
    instruction: `Écoutez la publicité du ${store}. L'offre mentionne : ${promo}.`,
    content: "Quelle promotion est annoncée ?",
    correct: promo.charAt(0).toUpperCase() + promo.slice(1),
    wrong: ["Paiement en plusieurs fois sans frais", "Ouverture vingt-quatre heures sur vingt-quatre", "Remboursement automatique"],
    explanation: "Publicité commerciale — avantage mis en avant.",
  };
}

function buildCoCultureDraft(index: number): QcmDraft {
  const venues = ["musée des beaux-arts", "théâtre du Nouveau Monde", "centre culturel", "bibliothèque municipale"];
  const venue = venues[index % venues.length];
  const price = [0, 10, 15, 20, 25][index % 5];
  const priceLabel = price === 0 ? "Gratuit" : `${price} dollars`;

  return {
    instruction: `Écoutez l'annonce culturelle. Le ${venue} propose une exposition ; l'entrée coûte ${priceLabel.toLowerCase()}.`,
    content: "Quel est le prix de l'entrée ?",
    correct: priceLabel,
    wrong: ["5 dollars", "30 dollars", "Sur réservation uniquement"],
    explanation: "Annonce culturelle — tarif indiqué dans le message.",
  };
}

const CO_BUILDERS = [
  buildCoTransportDraft,
  buildCoWeatherDraft,
  buildCoHealthDraft,
  buildCoWorkDraft,
  buildCoShopDraft,
  buildCoCultureDraft,
];

const CE_TOPICS = [
  "immigration",
  "éducation",
  "environnement",
  "logement",
  "santé publique",
  "culture",
  "transport",
  "emploi",
  "technologie",
  "administration",
];

const CE_FACT_TYPES = [
  "date limite",
  "montant",
  "durée",
  "lieu",
  "condition",
];

function buildCeImmigrationDraft(index: number): QcmDraft {
  const programs = ["PEQ", "Entrée express", "Programme des travailleurs qualifiés", "Résidence permanente humanitaire", "Programme des candidats des provinces"];
  const program = programs[index % programs.length];
  const months = 3 + (Math.floor(index / programs.length) % 12);
  const cities = ["Montréal", "Québec", "Gatineau", "Sherbrooke", "Laval"];
  const city = cities[Math.floor(index / (programs.length * 12)) % cities.length];

  return {
    instruction: `Le ${program} accélère certaines demandes à ${city}. Le délai moyen annoncé est de ${months} mois pour les dossiers complets.`,
    content: "Quel délai moyen est mentionné ?",
    correct: `${months} mois`,
    wrong: [`${months + 6} mois`, `${Math.max(2, months - 1)} semaines`, "24 mois"],
    explanation: "Texte administratif — repérer la durée chiffrée.",
  };
}

function buildCeEducationDraft(index: number): QcmDraft {
  const institutions = ["Université de Montréal", "UQAM", "Université Laval", "Université de Sherbrooke", "Université du Québec à Trois-Rivières", "HEC Montréal"];
  const institution = institutions[index % institutions.length];
  const day = 1 + (Math.floor(index / institutions.length) % 28);
  const month = ["janvier", "février", "mars", "avril", "mai", "juin", "septembre", "octobre"][Math.floor(index / (institutions.length * 28)) % 8];

  return {
    instruction: `${institution} ouvre les inscriptions aux cours de français pour nouveaux arrivants. La date limite est le ${day} ${month}.`,
    content: "Quand faut-il s'inscrire au plus tard ?",
    correct: `${day} ${month}`,
    wrong: [`${day} juillet`, "Toute l'année sans limite", "Uniquement en décembre"],
    explanation: "Avis universitaire — date limite explicite.",
  };
}

function buildCeEnvironmentDraft(index: number): QcmDraft {
  const actions = [
    "limiter l'utilisation du plastique à usage unique",
    "planter mille arbres en centre-ville",
    "instaurer le compostage obligatoire",
    "réduire les émissions de gaz à effet de serre de 30 %",
  ];
  const action = actions[index % actions.length];
  const year = 2026 + (index % 4);

  return {
    instruction: `La ville de Montréal annonce une nouvelle mesure écologique pour ${year} : ${action}.`,
    content: "Quelle mesure est annoncée ?",
    correct: action.charAt(0).toUpperCase() + action.slice(1),
    wrong: ["Supprimer tous les parcs urbains", "Interdire les vélos électriques", "Augmenter la circulation automobile"],
    explanation: "Communiqué municipal — mesure environnementale décrite.",
  };
}

function buildCeHousingDraft(index: number): QcmDraft {
  const aids = [500, 750, 1000, 1250, 1500];
  const aid = aids[index % aids.length];
  const months = 6 + (index % 7);

  return {
    instruction: `Le gouvernement du Québec propose une aide au logement de ${aid} $ par mois pendant ${months} mois pour les étudiants étrangers admissibles.`,
    content: "Quel montant mensuel d'aide est prévu ?",
    correct: `${aid} $ par mois`,
    wrong: [`${aid / 2} $ par mois`, `${aid} $ par an`, "Un logement gratuit"],
    explanation: "Programme social — montant et période dans le texte.",
  };
}

function buildCeHealthDraft(index: number): QcmDraft {
  const services = ["vaccination gratuite", "dépistage sans rendez-vous", "consultation virtuelle", "clinique mobile"];
  const service = services[index % services.length];
  const hours = ["8 h – 16 h", "9 h – 17 h", "10 h – 18 h", "12 h – 20 h"][index % 4];

  return {
    instruction: `Le CLSC du quartier offre ${service} du lundi au vendredi, de ${hours}.`,
    content: "Quels horaires sont indiqués ?",
    correct: hours,
    wrong: ["24 h sur 24", "Uniquement le week-end", "Sur rendez-vous seulement"],
    explanation: "Affiche de service public — plage horaire précise.",
  };
}

function buildCeCultureDraft(index: number): QcmDraft {
  const events = ["Festival de jazz", "Nuit des musées", "Semaine du cinéma québécois", "Journées de la culture", "Festival Juste pour rire", "Francofolies"];
  const event = events[index % events.length];
  const places = ["Place des Arts", "Vieux-Port", "Quartier des spectacles", "Parc Jean-Drapeau", "Grand Quai", "Maison de la culture"];
  const place = places[Math.floor(index / events.length) % places.length];

  return {
    instruction: `${event} se tiendra cette année au ${place}. L'entrée est gratuite pour les résidents de l'île de Montréal.`,
    content: "Où se déroule l'événement ?",
    correct: place,
    wrong: ["Au centre commercial", "À l'université", "En banlieue seulement"],
    explanation: "Programme culturel — lieu de l'événement.",
  };
}

function buildCeTransportDraft(index: number): QcmDraft {
  const lines = ["orange", "bleue", "verte", "jaune", "remplacement STM"];
  const line = lines[index % lines.length];
  const stations = ["Berri-UQAM", "Lionel-Groulx", "Jean-Talon", "Snowdon", "McGill", "Place-d'Armes"];
  const station = stations[Math.floor(index / lines.length) % stations.length];
  const minutes = 5 + (Math.floor(index / (lines.length * stations.length)) % 25);

  return {
    instruction: `La STM informe les usagers : la ligne ${line} connaît un ralentissement près de ${station}. Temps d'attente estimé : ${minutes} minutes.`,
    content: "Quel est le temps d'attente annoncé ?",
    correct: `${minutes} minutes`,
    wrong: [`${minutes + 15} minutes`, "Service normal", "Fermeture totale de la ligne"],
    explanation: "Communiqué transport — durée chiffrée indiquée.",
  };
}

function buildCeEmploymentDraft(index: number): QcmDraft {
  const sectors = ["santé", "informatique", "hôtellerie", "construction", "éducation", "commerce"];
  const sector = sectors[index % sectors.length];
  const salary = 18 + (Math.floor(index / sectors.length) % 20);
  const hours = 20 + (Math.floor(index / (sectors.length * 20)) % 20);

  return {
    instruction: `Emploi Québec publie plusieurs postes dans le secteur ${sector}. L'offre mentionne ${hours} h par semaine et un salaire horaire de ${salary} $.`,
    content: "Quel salaire horaire est proposé ?",
    correct: `${salary} $`,
    wrong: [`${salary + 10} $`, `${Math.max(15, salary - 8)} $ par mois`, "Non précisé"],
    explanation: "Offre d'emploi — repérer la rémunération horaire.",
  };
}

function buildCeTechnologyDraft(index: number): QcmDraft {
  const services = ["connexion Internet haut débit", "application mobile de citoyenneté", "portail numérique des impôts", "identité numérique", "signature électronique"];
  const service = services[index % services.length];
  const support = ["24 h/24", "du lundi au vendredi", "uniquement le week-end", "sur rendez-vous"][Math.floor(index / services.length) % 4];

  return {
    instruction: `Le gouvernement lance ${service} pour simplifier les démarches. L'assistance technique est disponible ${support}.`,
    content: "Quand l'assistance technique est-elle disponible ?",
    correct: support.charAt(0).toUpperCase() + support.slice(1),
    wrong: ["Jamais", "Uniquement par courrier", "Seulement en personne"],
    explanation: "Annonce numérique — disponibilité du support.",
  };
}

function buildCeAdministrationDraft(index: number): QcmDraft {
  const docs = ["permis de conduire", "carte d'assurance maladie", "certificat de naissance", "attestation de résidence", "numéro d'assurance sociale"];
  const doc = docs[index % docs.length];
  const fee = 0 + (Math.floor(index / docs.length) % 6) * 5;

  return {
    instruction: `Pour obtenir un ${doc}, la demande en ligne coûte ${fee} $. Le délai de traitement est de 10 jours ouvrables.`,
    content: "Quel est le coût de la demande en ligne ?",
    correct: fee === 0 ? "0 $" : `${fee} $`,
    wrong: [`${fee + 15} $`, "50 $", "Sur devis uniquement"],
    explanation: "Notice administrative — frais indiqués dans le texte.",
  };
}

function buildCeSportDraft(index: number): QcmDraft {
  const sports = ["hockey", "soccer", "course à pied", "natation", "ski de fond", "badminton"];
  const sport = sports[index % sports.length];
  const places = 20 + (Math.floor(index / sports.length) % 80);
  const day = ["samedi", "dimanche", "mercredi soir", "vendredi"][Math.floor(index / (sports.length * 80)) % 4];

  return {
    instruction: `Inscriptions ouvertes pour l'activité ${sport} au centre sportif municipal. ${places} places disponibles ; séance d'information le ${day}.`,
    content: "Combien de places sont disponibles ?",
    correct: `${places} places`,
    wrong: [`${places + 50} places`, "Liste d'attente seulement", "Activité complète"],
    explanation: "Annonce sportive — capacité chiffrée.",
  };
}

function buildCeTourismDraft(index: number): QcmDraft {
  const sites = ["Vieux-Québec", "Montmorency", "Oratoire Saint-Joseph", "Museum of History", "Chutes Montmorency", "Parc national de la Mauricie"];
  const site = sites[index % sites.length];
  const discount = 10 + (Math.floor(index / sites.length) % 5) * 5;

  return {
    instruction: `Découvrez ${site} avec une réduction de ${discount} % pour les détenteurs de la carte étudiant valide.`,
    content: "Quelle réduction est proposée ?",
    correct: `${discount} %`,
    wrong: [`${discount + 20} %`, "Entrée gratuite pour tous", "Réduction réservée aux seniors"],
    explanation: "Brochure touristique — pourcentage de réduction.",
  };
}

function buildCeFamilyDraft(index: number): QcmDraft {
  const programs = ["garde subventionnée", "congé parental prolongé", "activités parascolaires", "aide à la garde d'urgence"];
  const program = programs[index % programs.length];
  const amount = 100 + (Math.floor(index / programs.length) % 10) * 50;

  return {
    instruction: `Le ministère de la Famille annonce ${program} avec une aide mensuelle maximale de ${amount} $ pour les familles admissibles.`,
    content: "Quel montant mensuel maximal est mentionné ?",
    correct: `${amount} $`,
    wrong: [`${amount + 200} $`, `${amount} $ par an`, "Montant variable non précisé"],
    explanation: "Programme familial — plafond d'aide indiqué.",
  };
}

function buildCeFinanceDraft(index: number): QcmDraft {
  const products = ["REER", "CELI", "hypothèque à taux fixe", "carte de crédit étudiant", "compte chèques sans frais"];
  const product = products[index % products.length];
  const rate = 2 + (Math.floor(index / products.length) % 8);

  return {
    instruction: `La banque propose un ${product} avec un taux promotionnel de ${rate} % pour la première année.`,
    content: "Quel taux promotionnel est annoncé ?",
    correct: `${rate} %`,
    wrong: [`${rate + 5} %`, "0,5 %", "Taux non mentionné"],
    explanation: "Offre financière — taux chiffré dans le document.",
  };
}

function buildCeMediaDraft(index: number): QcmDraft {
  const formats = ["podcast", "infolettre", "documentaire", "émission hebdomadaire", "plateforme de streaming"];
  const format = formats[index % formats.length];
  const frequency = ["chaque matin", "deux fois par semaine", "le premier dimanche du mois", "en direct le jeudi"][Math.floor(index / formats.length) % 4];

  return {
    instruction: `Radio-Canada lance un nouveau ${format} sur l'intégration des nouveaux arrivants. Diffusion ${frequency}.`,
    content: "À quelle fréquence le contenu est-il diffusé ?",
    correct: frequency.charAt(0).toUpperCase() + frequency.slice(1),
    wrong: ["Une fois par an", "Uniquement en ligne archivé", "Sans horaire fixe"],
    explanation: "Annonce média — fréquence de diffusion.",
  };
}

const CE_BUILDERS = [
  buildCeImmigrationDraft,
  buildCeEducationDraft,
  buildCeEnvironmentDraft,
  buildCeHousingDraft,
  buildCeHealthDraft,
  buildCeCultureDraft,
  buildCeTransportDraft,
  buildCeEmploymentDraft,
  buildCeTechnologyDraft,
  buildCeAdministrationDraft,
  buildCeSportDraft,
  buildCeTourismDraft,
  buildCeFamilyDraft,
  buildCeFinanceDraft,
  buildCeMediaDraft,
];

function dedupeKey(q: BankQuestion): string {
  return `${q.instruction}||${q.content}`;
}

function mergeEditorialPool(
  base: BankQuestion[],
  builders: Array<(index: number) => QcmDraft>,
  target: number
): BankQuestion[] {
  const seen = new Set<string>();
  const pool: BankQuestion[] = [];

  for (const question of base) {
    const key = dedupeKey(question);
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({ ...question, order: pool.length + 1 });
  }

  let generatedIndex = 0;
  while (pool.length < target && generatedIndex < target * builders.length * 50) {
    const builder = builders[generatedIndex % builders.length];
    const draft = builder(Math.floor(generatedIndex / builders.length));
    const candidate = draftToQuestion(draft, pool.length + 1);
    const key = dedupeKey(candidate);

    if (!seen.has(key)) {
      seen.add(key);
      pool.push(candidate);
    }

    generatedIndex += 1;
  }

  return pool.slice(0, target);
}

let coPoolCache: BankQuestion[] | null = null;
let cePoolCache: BankQuestion[] | null = null;

export function generateEditorialCoPool(base: BankQuestion[]): BankQuestion[] {
  if (base.length === 0 && coPoolCache) return coPoolCache;
  const pool = mergeEditorialPool(base, CO_BUILDERS, TARGET_CO);
  if (base.length === 0) coPoolCache = pool;
  return pool;
}

export function generateEditorialCePool(base: BankQuestion[]): BankQuestion[] {
  if (base.length === 0 && cePoolCache) return cePoolCache;
  const pool = mergeEditorialPool(base, CE_BUILDERS, TARGET_CE);
  if (base.length === 0) cePoolCache = pool;
  return pool;
}

export const EDITORIAL_CO_COUNT = TARGET_CO;
export const EDITORIAL_CE_COUNT = TARGET_CE;
