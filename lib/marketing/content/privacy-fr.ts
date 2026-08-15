import type { LegalContent } from "@/lib/marketing/content/legal";
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_PHONE,
  PUBLIC_CONTACT_PHONE_TEL,
  PUBLIC_WHATSAPP_URL,
} from "@/lib/email/contact";

export const privacyFr: LegalContent = {
  title: "Politique de confidentialité",
  lastUpdated: "Dernière mise à jour : 01 novembre 2023",
  sections: [
    {
      title: "Notre engagement",
      paragraphs: [
        "Notre engagement en matière de confidentialité vise à détailler nos pratiques concernant la collecte, l'utilisation et la confidentialité de vos données lors de l'utilisation de nos services. Notre objectif est de vous informer sur vos droits en matière de confidentialité et sur les mesures prises pour assurer la protection de vos informations.",
        "Nous mettons à profit vos informations personnelles dans le but d'améliorer nos services. En utilisant notre plateforme, vous consentez à la collecte et à l'exploitation de vos informations conformément à notre politique de confidentialité. Celle-ci a été conçue selon nos propres directives en matière de protection des données.",
      ],
    },
    {
      title: "Interprétation et définitions",
      paragraphs: [
        "Les mots dont la lettre initiale est en majuscule ont des significations définies dans les conditions suivantes. Les définitions suivantes doivent avoir le même sens qu'ils apparaissent au singulier ou au pluriel.",
      ],
    },
    {
      title: "Définitions",
      paragraphs: ["Aux fins de la présente politique de confidentialité :"],
      list: [
        {
          text: "Compte désigne un compte unique créé pour vous permettre d'accéder à notre service ou parties de notre Service.",
        },
        {
          text: "Société (appelée soit « la Société », « Nous », « Notre » ou « Nos » dans cette Entente) fait référence à objectif-canada-tcf.",
        },
        {
          text: "Les cookies sont de petits fichiers qui sont placés sur votre ordinateur, appareil mobile ou tout autre terminal par un site internet, contenant les détails de votre historique de navigation sur ce site Web parmi ses nombreuses utilisations.",
        },
        { text: "Le pays fait référence à : Canada." },
        {
          text: "Appareil désigne tout appareil pouvant accéder au Service tel qu'un ordinateur, un téléphone portable ou une tablette numérique.",
        },
        {
          text: "Les données personnelles sont toutes les informations relatives à une personne identifiée ou individu identifiable.",
        },
        {
          text: "Le service fait référence au site Web et à tout ce qui s'y réfère.",
        },
        {
          text: "Prestataire désigne toute personne physique ou morale qui traite les données au nom de la compagnie. Il fait référence à des sociétés tierces ou aux personnes employées par la Société pour faciliter le Service, fournir le Service pour le compte de la Société, exécuter des services liés au Service ou aider la Société à analyser l'utilisation du Service.",
        },
        {
          text: "Les données d'utilisation font référence aux données collectées automatiquement, soit générées par l'utilisation du Service ou de l'infrastructure du Service elle-même (par exemple, la durée d'une visite de page).",
        },
        {
          text: "Le site Web fait référence à Objectif TCF, accessible [à partir de ce lien](https://objectif-tcf.org).",
        },
        {
          text: "Vous désigne la personne accédant ou utilisant le Service, ou la société, ou toute autre entité juridique au nom de laquelle cette personne accède ou utilise le Service, le cas échéant.",
        },
      ],
    },
    {
      title: "Collecte et utilisation de vos données personnelles",
      subsections: [
        {
          title: "Types de données collectées",
          subsections: [
            {
              title: "Données personnelles",
              paragraphs: [
                "Lors de l'utilisation de notre service, nous pouvons vous demander de nous fournir certaines informations personnelles identifiables qui peuvent être utilisées pour vous contacter ou vous identifier.",
                "Les informations personnellement identifiables peuvent inclure, mais sans s'y limiter :",
              ],
              list: [
                { text: "Adresse e-mail" },
                { text: "Prénom et nom" },
                // { text: "Numéro de téléphone" },
                { text: "Des données d'utilisation" },
              ],
            },
            {
              title: "Données d'utilisation",
              paragraphs: [
                "Les données d'utilisation sont collectées automatiquement lors de l'utilisation du service.",
                "Les données d'utilisation peuvent inclure des informations telles que le protocole Internet de votre appareil (par exemple, adresse IP), type de navigateur, version du navigateur, les pages de notre Service que vous visitez, l'heure et la date de votre visite, le temps passé sur ces pages, des identifiants d'appareil uniques et d'autres données de diagnostic.",
                "Lorsque vous accédez au service par ou via un appareil mobile, nous pouvons collecter certaines informations automatiquement, y compris, mais sans s'y limiter, le type de l'appareil mobile que vous utilisez, l'identifiant unique de votre appareil mobile, l'adresse IP de votre appareil mobile, votre système d'exploitation mobile, le type de navigateur mobile que vous utilisez, des identifiants d'appareil uniques et d'autres données de diagnostic.",
                "Nous pouvons également collecter des informations que votre navigateur envoie chaque fois que vous visitez notre Service ou lorsque vous accédez au Service par ou via un appareil mobile.",
              ],
            },
          ],
        },
        {
          title: "Technologies de suivi et cookies",
          paragraphs: [
            "Nous utilisons des cookies et des technologies de suivi similaires pour suivre l'activité sur notre Service et stocker certaines informations. Les technologies de traçage utilisées sont les balises, tags et scripts pour collecter et suivre les informations et pour améliorer et analyser notre service.",
            "Les technologies que nous utilisons peuvent inclure :",
          ],
          list: [
            {
              text: "Cookies ou cookies de navigateur. Un cookie est un petit fichier placé sur votre appareil. Vous pouvez demander à votre navigateur de refuser tous les cookies ou d'indiquer lorsqu'un cookie est envoyé. Toutefois, si vous n'acceptez pas les cookies, vous ne serez pas en mesure d'utiliser certaines parties de notre Service. Sauf si vous avez ajusté les paramètres de votre navigateur pour qu'il refuse les cookies, notre Service peut utiliser des cookies.",
            },
            {
              text: "Cookies Flash. Certaines fonctionnalités de notre Service peuvent utiliser des objets locaux (ou Flash Cookies) pour collecter et stocker des informations sur vos préférences ou votre activité sur notre service. Les Flash Cookies ne sont pas gérés par les mêmes paramètres de navigateur que ceux utilisés pour les cookies de navigateur. Pour plus d'informations sur la façon dont vous pouvez supprimer les cookies Flash, veuillez lire « Où puis-je modifier les paramètres de désactivation ou de suppression des objets locaux partagés ? » [disponible ici](https://www.adobe.com/products/flashplayer/end-of-life.html#main_Where_can_I_change_the_settings_for_disabling__or_deleting_local_shared_objects_).",
            },
            {
              text: "Balises Web. Certaines sections de notre Service et nos e-mails peuvent contenir de petits fichiers électroniques connus sous le nom de balises Web (également appelés balises gifs, balises pixel et gifs à pixel unique) qui permettent à la Société, par exemple, de compter les utilisateurs qui ont visité ces pages ou ouvert un e-mail et pour d'autres statistiques de site Web connexes (par exemple, l'enregistrement de la popularité d'une certaine section et vérification de l'intégrité du système et du serveur).",
            },
          ],
          subsections: [
            {
              title: "Types de cookies utilisés",
              paragraphs: [
                "Les cookies peuvent être des cookies « persistants » ou « de session ». Les cookies persistants restent sur votre ordinateur personnel ou appareil mobile lorsque vous vous déconnectez, tandis que les cookies de session sont supprimés dès que vous fermez votre navigateur Internet.",
                "Vous pouvez en savoir plus sur les cookies [en cliquant ici](https://www.termsfeed.com/privacy-policy-generator/#faq-8).",
                "Nous utilisons à la fois des cookies de session et des cookies persistants aux fins décrites ci-dessous :",
              ],
              list: [
                {
                  text: "Cookies nécessaires / essentiels",
                  children: [
                    { text: "Type : Cookies de session" },
                    { text: "Administré par : nous" },
                    {
                      text: "Finalité : Ces cookies sont indispensables pour vous fournir des services disponibles sur le site Web et pour vous permettre d'utiliser certaines de ses caractéristiques. Ils aident à authentifier les utilisateurs et à prévenir l'utilisation frauduleuse de comptes utilisateurs. Sans ces cookies, les services que vous avez demandés ne peuvent pas être fournis, et nous n'utilisons ces cookies que pour vous fournir ces prestations.",
                    },
                  ],
                },
                {
                  text: "Politique relative aux cookies / Avis d'acceptation des cookies",
                  children: [
                    { text: "Type : Cookies persistants" },
                    { text: "Administré par : nous sur le site internet" },
                    {
                      text: "Objectif : ces cookies identifient si les utilisateurs ont accepté l'utilisation de cookies.",
                    },
                  ],
                },
                {
                  text: "Cookies de fonctionnalités",
                  children: [
                    { text: "Type : Cookies persistants" },
                    { text: "Administré par : nous sur le site internet" },
                    {
                      text: "Finalité : ces cookies nous permettent de mémoriser les choix que vous faites lorsque vous utilisez le site Web, comme la mémorisation de vos informations de connexion ou de votre langue préférée. Le but de ces cookies est de vous offrir une meilleure expérience personnelle et de vous éviter d'avoir à ressaisir vos préférences chaque fois que vous utilisez le site Web.",
                    },
                  ],
                },
              ],
              paragraphsAfterList: [
                "Pour plus d'informations sur les cookies que nous utilisons et vos choix concernant les cookies, veuillez consulter notre Politique relative aux cookies ou la section Cookies de notre politique de confidentialité.",
              ],
            },
          ],
        },
        {
          title: "Utilisation de vos données personnelles",
          paragraphs: [
            "La Société peut utiliser les Données personnelles aux fins suivantes :",
          ],
          list: [
            {
              text: "Pour fournir et maintenir notre Service, y compris pour surveiller l'utilisation de notre Service.",
            },
            {
              text: "Pour gérer Votre Compte : pour gérer votre inscription en tant qu'utilisateur du Service. Les données personnelles que vous fournissez peuvent vous donner accès à différentes fonctionnalités du service qui sont à votre disposition en tant qu'utilisateur enregistré.",
            },
            {
              text: "Pour l'exécution d'un contrat : l'élaboration, la conformité et la réalisation du contrat d'achat des produits, articles ou services que vous avez achetés ou de tout autre contrat avec nous par le biais du service.",
            },
            {
              text: "Pour vous contacter : pour vous contacter par e-mail, appels téléphoniques, SMS ou autres formes équivalentes de communication électronique, telles que les notifications push d'une application mobile concernant les mises à jour ou les communications informatives relatives aux fonctionnalités, produits ou services sous contrat, y compris les mises à jour de sécurité, lorsque cela est nécessaire ou raisonnable pour leur mise en œuvre.",
            },
            {
              text: "Pour vous fournir des actualités, des offres spéciales et des informations générales sur d'autres biens, services et évènements que nous proposons et qui sont similaires à ceux que vous avez déjà achetés ou demandés, sauf si vous avez choisi de ne pas recevoir ces informations.",
            },
            {
              text: "Pour gérer vos demandes : pour assister et gérer vos demandes que vous nous adressez.",
            },
            {
              text: "Pour les transferts d'entreprise : nous pouvons utiliser vos informations pour évaluer ou mener une fusion, une cession, une restructuration, une réorganisation, une dissolution ou toute autre vente ou transfert de tout ou partie de nos actifs, que ce soit dans le cadre d'une entreprise en activité ou dans le cadre d'une faillite, d'une liquidation, ou procédure similaire, dans laquelle les données personnelles que nous détenons sur les utilisateurs de nos services font partie des actifs transférés.",
            },
            {
              text: "À d'autres fins : nous pouvons utiliser vos informations à d'autres fins, telles que l'analyse de données, l'identification des tendances d'utilisation, la détermination de l'efficacité de nos campagnes promotionnelles et pour évaluer et améliorer notre service, nos produits, nos services, notre marketing et votre expérience.",
            },
          ],
          paragraphsAfterList: [
            "Nous pouvons partager vos informations personnelles dans les situations suivantes :",
          ],
          listAfterParagraphs: [
            {
              text: "Avec les fournisseurs de services : nous pouvons partager vos informations personnelles avec des fournisseurs de services pour surveiller et analyser l'utilisation de notre service, pour vous contacter.",
            },
            {
              text: "Pour les transferts d'entreprise : nous pouvons partager ou transférer vos informations personnelles dans le cadre de, ou pendant les négociations de, toute fusion, vente d'actifs de la société, financement ou acquisition de tout ou partie de nos activités à une autre société.",
            },
            {
              text: "Avec les affiliés : nous pouvons partager vos informations avec nos affiliés, auquel cas nous exigeons de ces affiliés qu'ils respectent la présente politique de confidentialité. Les sociétés affiliées incluant notre société mère et toutes autres filiales, partenaires de coentreprise ou autres sociétés que nous contrôlons ou qui sont sous contrôle commun avec nous.",
            },
            {
              text: "Avec des partenaires commerciaux : nous pouvons partager vos informations avec nos partenaires commerciaux pour vous proposer certains produits, services ou promotions.",
            },
            {
              text: "Avec d'autres utilisateurs : lorsque vous partagez des informations personnelles ou interagissez autrement dans les zones publiques avec d'autres utilisateurs, ces informations peuvent être vues par tous les utilisateurs et peuvent être diffusées publiquement à l'extérieur.",
            },
            {
              text: "Avec votre consentement : nous pouvons divulguer vos informations personnelles à toute autre fin avec votre consentement.",
            },
          ],
        },
      ],
    },
    {
      title: "Conservation de vos données personnelles",
      paragraphs: [
        "La Société ne conservera vos données personnelles que le temps nécessaire aux fins énoncées dans la présente politique de confidentialité. Nous conserverons et utiliserons vos données personnelles dans la mesure nécessaire pour nous conformer à nos obligations légales (par exemple, si nous sommes tenus de conserver vos données pour nous conformer aux lois applicables), résoudre les litiges et appliquer nos accords et politiques juridiques.",
        "La Société conservera également les données d'utilisation à des fins d'analyse interne. Les données d'utilisation sont généralement conservées pendant une période plus courte, sauf lorsque ces données sont utilisées pour renforcer la sécurité ou pour améliorer la fonctionnalité de notre service, ou lorsque nous sommes légalement tenus de conserver ces données pendant des périodes plus longues.",
      ],
    },
    {
      title: "Transfert de vos données personnelles",
      paragraphs: [
        "Vos informations, y compris les données personnelles, sont traitées dans les bureaux d'exploitation de la société et dans tout autre lieu où se trouvent les parties impliquées dans le traitement. Cela signifie que ces informations peuvent être transférées et conservées sur des ordinateurs situés en dehors de votre état, province, pays ou autre juridiction gouvernementale où les lois sur la protection des données peuvent différer de celles de votre juridiction.",
        "Votre consentement à cette politique de confidentialité suivi de votre soumission de ces informations représente votre accord à ce transfert.",
        "La société prendra toutes les mesures raisonnablement nécessaires pour garantir que vos données sont traitées en toute sécurité et conformément à la présente politique de confidentialité et aucun transfert de vos données personnelles n'aura lieu vers une organisation ou un pays à moins que des contrôles adéquats ne soient en place, y compris la sécurité de vos données et autres informations personnelles.",
      ],
    },
    {
      title: "Divulgation de vos données personnelles",
      subsections: [
        {
          title: "Transactions commerciales",
          paragraphs: [
            "Si la Société est impliquée dans une fusion, une acquisition ou une vente d'actifs, vos Données personnelles peuvent être transférées. Nous vous aviserons avant que vos données personnelles ne soient transférées et soumises à une politique de confidentialité différente.",
          ],
        },
        {
          title: "Forces de l'ordre",
          paragraphs: [
            "Dans certaines circonstances, la Société peut être tenue de divulguer vos données personnelles si la loi l'exige ou en réponse à des demandes valables d'autorités publiques (par exemple, un tribunal ou une agence gouvernementale).",
          ],
        },
        {
          title: "Autres exigences légales",
          paragraphs: [
            "La Société peut divulguer vos données personnelles en croyant de bonne foi qu'une telle action est nécessaire pour :",
          ],
          list: [
            { text: "Respecter une obligation légale" },
            { text: "Protéger et défendre les droits ou la propriété de la Société" },
            {
              text: "Prévenir ou enquêter sur d'éventuels actes répréhensibles en rapport avec le Service",
            },
            {
              text: "Protéger la sécurité personnelle des Utilisateurs du Service ou du public",
            },
            { text: "Se protéger contre la responsabilité légale" },
          ],
        },
      ],
    },
    {
      title: "Sécurité de vos données personnelles",
      paragraphs: [
        "La sécurité de vos données personnelles est importante pour nous, mais rappelez-vous qu'aucune méthode de transmission sur Internet ou méthode de stockage électronique n'est sécurisée à 100 %. Bien que nous nous efforçons d'utiliser des moyens commercialement acceptables pour protéger vos données personnelles, nous ne pouvons garantir leur sécurité absolue.",
      ],
    },
    {
      title: "Confidentialité des enfants",
      paragraphs: [
        "Notre service ne s'adresse pas aux personnes de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnellement identifiables auprès de personnes de moins de 13 ans. Si vous êtes parent ou tuteur et que vous savez que votre enfant nous a fourni des données personnelles, veuillez nous contacter. Si nous constatons que nous avons collecté des données personnelles auprès d'une personne de moins de 13 ans sans vérification du consentement parental, nous prenons des mesures pour supprimer ces informations de nos serveurs.",
        "Si nous devons compter sur le consentement comme base légale pour le traitement de vos informations et que votre pays exige le consentement d'un parent, nous pouvons exiger le consentement de votre parent avant de collecter et d'utiliser ces informations.",
      ],
    },
    {
      title: "Liens vers d'autres sites Web",
      paragraphs: [
        "Notre service peut contenir des liens vers d'autres sites Web qui ne sont pas exploités par nous. Si vous cliquez sur un lien tiers, vous serez dirigé vers le site de ce tiers. Nous vous conseillons vivement de consulter la politique de confidentialité de chaque site que vous visitez.",
        "Nous n'avons aucun contrôle et n'assumons aucune responsabilité quant au contenu, aux politiques de confidentialité ou aux pratiques des sites ou services tiers.",
      ],
    },
    {
      title: "Modifications de cette politique de confidentialité",
      paragraphs: [
        "Nous pouvons mettre à jour notre politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialité sur cette page.",
        "Nous vous informerons par e-mail et/ou par un avis visible sur notre service, avant que le changement ne devienne effectif et mettrons à jour la date de « dernière mise à jour » en haut de cette politique de confidentialité.",
        "Il vous est conseillé de consulter périodiquement cette politique de confidentialité pour tout changement. Les modifications apportées à cette politique de confidentialité entrent en vigueur lorsqu'elles sont publiées sur cette page.",
      ],
    },
    {
      title: "Nous contacter",
      paragraphs: [
        "Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter :",
      ],
      list: [
        {
          text: `Par courriel : [${PUBLIC_CONTACT_EMAIL}](mailto:${PUBLIC_CONTACT_EMAIL})`,
        },
        {
          text: `Par téléphone : [${PUBLIC_CONTACT_PHONE}](tel:${PUBLIC_CONTACT_PHONE_TEL})`,
        },
        {
          text: `Par WhatsApp : [${PUBLIC_CONTACT_PHONE}](${PUBLIC_WHATSAPP_URL})`,
        },
      ],
    },
  ],
};
