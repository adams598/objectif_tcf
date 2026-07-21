export interface UsefulLinksBlock {
  subtitle: string;
  introBeforeLink: string;
  introLink: { label: string; href: string };
  introAfterLink: string;
  tipsIntro: string;
  beforeTitle: string;
  beforeItems: Array<
    | string
    | {
        before?: string;
        link: { label: string; href: string };
        after?: string;
      }
  >;
  duringTitle: string;
  duringItems: string[];
}

export interface AboutTcfSection {
  id: string;
  title: string;
  paragraphs?: string[];
  quote?: string;
  list?: string[];
  numberedList?: string[];
  table?: {
    title?: string;
    headers: string[];
    rows: string[][];
  };
  linkBox?: { label: string; href: string };
  accordions?: { title: string; content: string }[];
  usefulLinks?: UsefulLinksBlock;
}

export interface AboutTcfContent {
  heroTitle: string;
  heroHighlight: string;
  sections: AboutTcfSection[];
}

const fr: AboutTcfContent = {
  heroTitle: "Mieux",
  heroHighlight: "connaître le TCF",
  sections: [
    {
      id: "presentation",
      title: "C'est quoi le TCF",
      paragraphs: [
        "Le TCF Canada est un test accrédité par Immigration, réfugiés et citoyenneté Canada (IRCC). Le TCF Canada est également reconnu, depuis fin janvier 2022, par le ministère de l'Immigration, de la Francisation et de l'Intégration (MIFI) pour une demande d'immigration dans la province du Québec.",
        "Le TCF Canada est destiné à toute personne de 16 ans ou plus, quelle que soit sa nationalité ou sa langue maternelle, ayant besoin de certifier son niveau de français dans le cadre des démarches d'immigration économique au Canada ou d'obtention de la citoyenneté canadienne et qui, de ce fait, doit déposer un dossier auprès d'Immigration, réfugiés et citoyenneté Canada (IRCC).",
      ],
      quote: "Il n'existe pas de cas de dispense pour le TCF Canada",
    },
    {
      id: "epreuves",
      title: "Les épreuves du TCF",
      paragraphs: [
        "Le TCF Canada est composé de 4 épreuves obligatoires évaluant les compétences en langue française générale et à une durée totale de 2 heures 47 minutes.",
      ],
      numberedList: [
        "Compréhension orale — Épreuve collective de 39 questions à choix multiple (4 choix de réponses, une seule réponse correcte) sur une durée de 35 minutes.",
        "Compréhension écrite — Épreuve collective de 39 questions à choix multiple (4 choix de réponses, 1 seule bonne réponse possible) sur une durée de 60 minutes.",
        "Expression écrite — Épreuve collective de 3 exercices sur une durée de 60 minutes.",
        "Expression orale — Épreuve individuelle en face à face avec un examinateur pour 3 exercices sur une durée de 12 minutes (dont 2 minutes de préparation).",
      ],
    },
    {
      id: "preparation",
      title: "Comment vous préparer pour chaque épreuve ?",
      accordions: [
        {
          title: "Compréhension orale",
          content:
            "Entraînez-vous régulièrement à l'écoute de documents audio variés (radio, podcasts, vidéos). Sur Objectif TCF, nos séries de compréhension orale reproduisent le format officiel avec chronomètre et correction automatique.",
        },
        {
          title: "Compréhension écrite",
          content:
            "Lisez des textes d'actualité, des articles et des documents administratifs en français. Nos séries CE vous permettent de vous familiariser avec les types de questions et de gérer votre temps efficacement.",
        },
        {
          title: "Expression écrite",
          content:
            "Pratiquez les trois tâches d'expression écrite avec des sujets d'actualité. Objectif TCF propose une correction détaillée par des correcteurs certifiés pour progresser sur la structure, le vocabulaire et la grammaire.",
        },
        {
          title: "Expression orale",
          content:
            "Simulez les trois tâches de l'épreuve orale : entretien dirigé, interaction et expression d'un point de vue. Entraînez-vous à parler sans notes et à structurer vos réponses clairement.",
        },
      ],
    },
    {
      id: "inscription",
      title: "Inscription au TCF",
      paragraphs: [
        "Les sessions du TCF Canada sont organisées tout au long de l'année. Les centres agréés sont autorisés à organiser les sessions en fonction de leurs possibilités.",
        "Il vous appartient de contacter directement le centre agréé TCF le plus proche de votre domicile.",
        "Le centre agréé TCF vous renseignera sur :",
      ],
      numberedList: [
        "Les dates des sessions ;",
        "La procédure d'inscription ;",
        "Le lieu de la passation des épreuves ;",
        "Le support de passation (sur papier ou sur support ordinateur) ;",
        "Le tarif.",
      ],
      linkBox: {
        label: "Carte des centres de passation TCF",
        href: "https://www.france-education-international.fr/tcf-canada",
      },
    },
    {
      id: "resultats",
      title: "Résultat du TCF",
      paragraphs: [
        "Vos résultats seront transmis au centre de passation dans un délai de 15 jours ouvrés à compter de la date de réception du matériel de session par France Éducation international.",
        "C'est le centre de passation qui doit vous remettre votre attestation TCF.",
        "Votre attestation aura une durée de validité de 2 ans à partir de la date de délivrance des résultats. Cette date de validité sera indiquée sur votre attestation.",
        "Le TCF Canada évalue six niveaux de connaissance du français (définis en référence au Cadre européen commun de référence pour les langues du Conseil de l'Europe).",
      ],
      table: {
        headers: [
          "A1 non atteint",
          "A1",
          "A2",
          "B1",
          "B2",
          "C1",
          "C2",
        ],
        rows: [
          [
            "0 à 100 pts",
            "101 à 199 pts",
            "200 à 299 pts",
            "300 à 399 pts",
            "400 à 499 pts",
            "500 à 599 pts",
            "600 à 699 pts",
          ],
        ],
      },
      list: [
        "Un score pour la compréhension orale et un score pour la compréhension écrite ;",
        "Une note sur 20 pour l'expression orale et une note sur 20 pour l'expression écrite ;",
        "Un niveau par compétence (compréhension écrite, compréhension orale, expression écrite, expression orale), qui pourra aller de « A1 non atteint » à « C2 ».",
      ],
    },
    {
      id: "nclc",
      title: "Quel niveau doit-on atteindre pour obtenir des points ?",
      paragraphs: [
        "Les niveaux requis en compétences linguistiques pour les démarches d'immigration vers le Canada sont détaillés sur le site de IRCC.",
        "Dans votre dossier d'immigration, vous devrez reporter ces résultats grâce au niveau de compétence linguistique canadien (NCLC) correspondant à vos résultats.",
        "Pour connaître ce niveau, vous pouvez vous référer au tableau de correspondance NCLC :",
      ],
      table: {
        title: "Résultats au TCF Canada",
        headers: [
          "NCLC",
          "Compréhension orale",
          "Compréhension écrite",
          "Expression orale",
          "Expression écrite",
        ],
        rows: [
          [
            "10 et plus",
            "549 à 699 (C1-C2)",
            "549 à 699 (C1-C2)",
            "16 à 20 (C1-C2)",
            "16 à 20 (C1-C2)",
          ],
          [
            "9",
            "523 à 548 (C1)",
            "524 à 548 (C1)",
            "14-15 (C1)",
            "14-15 (C1)",
          ],
          [
            "8",
            "503 à 522 (C1)",
            "499 à 523 (B2-C1)",
            "12-13 (B2)",
            "12-13 (B2)",
          ],
          [
            "7",
            "458 à 502 (B2-C1)",
            "453 à 498 (B2)",
            "10-11 (B2)",
            "10-11 (B2)",
          ],
          [
            "6",
            "398 à 457 (B1-B2)",
            "406 à 452 (B2)",
            "7-8-9 (B1)",
            "7-8-9 (B1)",
          ],
          [
            "5",
            "369 à 397 (B1)",
            "375 à 405 (B1-B2)",
            "6 (B1)",
            "6 (B1)",
          ],
          [
            "4",
            "331 à 368 (B1)",
            "342 à 374 (B1)",
            "4-5 (A2)",
            "4-5 (A2)",
          ],
        ],
      },
    },
    {
      id: "liens-utiles",
      title: "Liens utiles",
      usefulLinks: {
        subtitle: "Préparation aux épreuves",
        introBeforeLink:
          "Le TCF Canada n'est pas basé sur un programme de cours mais sur vos compétences en langue française et la capacité générale du candidat à utiliser le français. Ce niveau de langue dépend de la pratique de chacun et peut être amélioré par l'étude du français lors de cours ou d'études d'ouvrages spécifiques (voir ",
        introLink: {
          label: "la fiche ressources",
          href: "https://liseo.france-education-international.fr/site/bibliographies/bibliographie-ressources-preparation-tcf.pdf",
        },
        introAfterLink: ").",
        tipsIntro:
          "Les conseils pour se préparer à la passation du TCF sont les suivants :",
        beforeTitle: "Avant de passer le test :",
        beforeItems: [
          "Se familiariser avec le format du TCF (format et durée des épreuves),",
          {
            before: "Se familiariser avec le ",
            link: {
              label: "déroulement d'une passation TCF",
              href: "https://www.france-education-international.fr/article/deroulement-passation-tcf",
            },
          },
          {
            before: "Prendre connaissance ",
            link: {
              label: "des exemples d'épreuves",
              href: "https://www.france-education-international.fr/test/exemples-epreuves-tcf?langue=fr",
            },
          },
          "S'immerger aussi souvent que possible dans la langue française en lisant, regardant la télévision, écoutant la radio, des enregistrements, conversant avec des proches,",
        ],
        duringTitle: "Pendant le test :",
        duringItems: [
          "Écouter attentivement les consignes,",
          "Rester le plus concentré possible notamment pendant l'épreuve de compréhension orale,",
          "Ne pas perdre de temps en prenant des notes pour les épreuves QCM,",
          "Gérer son temps pour les épreuves de maîtrise de structure de la langue et la compréhension écrite ainsi que pour l'épreuve d'expression écrite (il faut bien réaliser les 3 tâches).",
        ],
      },
    },
  ],
};

const enUsefulLinks: UsefulLinksBlock = {
  subtitle: "Test preparation",
  introBeforeLink:
    "TCF Canada is not based on a course syllabus but on your French language skills and your general ability to use French. This level depends on individual practice and can be improved through courses or specific study materials (see ",
  introLink: {
    label: "the resources sheet",
    href: "https://liseo.france-education-international.fr/site/bibliographies/bibliographie-ressources-preparation-tcf.pdf",
  },
  introAfterLink: ").",
  tipsIntro: "Tips to prepare for the TCF:",
  beforeTitle: "Before the test:",
  beforeItems: [
    "Familiarize yourself with the TCF format (test format and duration),",
    {
      before: "Familiarize yourself with the ",
      link: {
        label: "TCF test day procedure",
        href: "https://www.france-education-international.fr/article/deroulement-passation-tcf",
      },
    },
    {
      before: "Review ",
      link: {
        label: "sample test questions",
        href: "https://www.france-education-international.fr/test/exemples-epreuves-tcf?langue=fr",
      },
    },
    "Immerse yourself in French as often as possible by reading, watching TV, listening to the radio, recordings, and talking with others,",
  ],
  duringTitle: "During the test:",
  duringItems: [
    "Listen carefully to the instructions,",
    "Stay as focused as possible, especially during the listening comprehension test,",
    "Don't waste time taking notes for the multiple-choice questions,",
    "Manage your time for the language structure and reading comprehension tests, as well as for the written expression test (all 3 tasks must be completed).",
  ],
};

const en: AboutTcfContent = {
  heroTitle: "Get to know",
  heroHighlight: "the TCF",
  sections: fr.sections.map((section) => ({
    ...section,
    title:
      section.id === "presentation"
        ? "What is the TCF"
        : section.id === "epreuves"
          ? "TCF test components"
          : section.id === "preparation"
            ? "How to prepare for each test?"
            : section.id === "inscription"
              ? "TCF registration"
              : section.id === "resultats"
                ? "TCF results"
                : section.id === "nclc"
                  ? "What level do you need for immigration points?"
                  : "Useful links",
    usefulLinks:
      section.id === "liens-utiles" ? enUsefulLinks : section.usefulLinks,
  })),
};

export function getAboutTcfContent(locale: string): AboutTcfContent {
  return locale.startsWith("en") ? en : fr;
}
