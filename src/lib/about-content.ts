/**
 * Drietalige inhoud voor de pagina "Wie zijn we": tijdlijn, teamleden en bestuur.
 * Los van de i18n-woordenlijst gehouden omdat het om redactionele blokken gaat.
 */

export type Lang = "nl" | "fr" | "en";

type Tri = Record<Lang, string>;

export type Milestone = {
  year: string;
  title: Tri;
  body: Tri;
};

export const MILESTONES: Milestone[] = [
  {
    year: "1987",
    title: {
      nl: "De boerderij wordt geboren",
      fr: "La ferme voit le jour",
      en: "The farm is born",
    },
    body: {
      nl: "Buurtbewoners en jeugdwerkers richten een kleine dierenweide op in het Maximiliaanpark, midden in het hart van Brussel.",
      fr: "Des riverains et des animateurs créent un petit enclos animalier dans le parc Maximilien, en plein cœur de Bruxelles.",
      en: "Neighbours and youth workers create a small animal paddock in Maximilien Park, in the heart of Brussels.",
    },
  },
  {
    year: "1995",
    title: {
      nl: "Eerste schoolprogramma's",
      fr: "Premiers programmes scolaires",
      en: "First school programmes",
    },
    body: {
      nl: "De boerderij ontvangt haar eerste klassen. Educatie rond dieren, voeding en de seizoenen wordt de kern van de werking.",
      fr: "La ferme accueille ses premières classes. L'éducation aux animaux, à l'alimentation et aux saisons devient le cœur du projet.",
      en: "The farm welcomes its first school classes. Education around animals, food and the seasons becomes the core of the project.",
    },
  },
  {
    year: "2008",
    title: {
      nl: "Moestuin, compost en bijen",
      fr: "Potager, compost et abeilles",
      en: "Vegetable garden, compost and bees",
    },
    body: {
      nl: "Een collectieve moestuin, composteringszone en bijenkasten maken van de site een levend voorbeeld van stedelijke kringlopen.",
      fr: "Un potager collectif, une zone de compostage et des ruches font du site un exemple vivant de cycles urbains.",
      en: "A collective garden, composting area and beehives turn the site into a living example of urban cycles.",
    },
  },
  {
    year: "2016",
    title: {
      nl: "Sociale tewerkstelling",
      fr: "Insertion socioprofessionnelle",
      en: "Social employment",
    },
    body: {
      nl: "Stages, sociale tewerkstelling en buurtprojecten geven de boerderij een tweede, sociale roeping naast haar educatieve werk.",
      fr: "Stages, insertion et projets de quartier donnent à la ferme une seconde vocation, sociale, à côté de l'éducatif.",
      en: "Internships, work integration and neighbourhood projects give the farm a second, social vocation alongside education.",
    },
  },
  {
    year: "2020",
    title: {
      nl: "Anker in de buurt",
      fr: "Ancrage dans le quartier",
      en: "An anchor in the neighbourhood",
    },
    body: {
      nl: "Tijdens de coronajaren blijft de boerderij open lucht en rust bieden aan een wijk met weinig groen.",
      fr: "Pendant les années covid, la ferme continue d'offrir air libre et calme à un quartier peu verdurisé.",
      en: "Through the covid years the farm keeps offering open air and calm to a neighbourhood with little greenery.",
    },
  },
  {
    year: "vandaag",
    title: {
      nl: "Eco-sociale stadsboerderij",
      fr: "Ferme urbaine éco-sociale",
      en: "Eco-social city farm",
    },
    body: {
      nl: "Meer dan 30.000 bezoekers per jaar, tientallen dieren, een hoeveproductie zonder verpakking en een groeiend netwerk van scholen en partners.",
      fr: "Plus de 30 000 visiteurs par an, des dizaines d'animaux, une production fermière sans emballage et un réseau croissant d'écoles et de partenaires.",
      en: "Over 30,000 visitors a year, dozens of animals, package-free farm produce and a growing network of schools and partners.",
    },
  },
];

export type Person = {
  id: string;
  name: string;
  /** i18n-sleutel van de functietitel (terugval). */
  roleKey: string;
  /** Exacte functietitel; heeft voorrang op roleKey. */
  role?: Tri;
  /** Onderwerp dat op /contact wordt voorgevuld. */
  subject: string;
  /** Enkel een echt, door de persoon goedgekeurd citaat. */
  quote?: Tri;
  bio: Tri;
};

/** Het team zoals op de oude site (lafermeduparcmaximilien.be/a-propos). */
export const TEAM: Person[] = [
  {
    id: "alexandre",
    name: "Alexandre",
    roleKey: "about.role.director",
    role: { nl: 'Directeur en imker', fr: 'Directeur et apiculteur', en: 'Director and beekeeper' },
    subject: "Directie",
    bio: { nl: 'Leidt de vzw en zorgt voor de bijenkorven op het dak van de boerderij.', fr: "Dirige l'ASBL et s'occupe des ruches sur le toit de la ferme.", en: 'Leads the non-profit and looks after the beehives on the farm roof.' },
  },
  {
    id: "nicole",
    name: "Nicole",
    roleKey: "about.role.director",
    role: { nl: 'Directieassistente', fr: 'Assistante de direction', en: 'Executive assistant' },
    subject: "Administratie",
    bio: { nl: 'Houdt de administratie, de reservaties en de facturatie van de boerderij op koers.', fr: "Tient l'administration, les réservations et la facturation de la ferme.", en: "Keeps the farm's administration, bookings and invoicing on track." },
  },
  {
    id: "philippine",
    name: "Philippine",
    roleKey: "about.role.projects",
    role: { nl: 'Verantwoordelijke communicatie en animator', fr: 'Responsable comm. et animatrice', en: 'Communications lead and facilitator' },
    subject: "Communicatie & pers",
    bio: { nl: 'Vertelt het verhaal van de boerderij en begeleidt animaties met kinderen en groepen.', fr: "Raconte l'histoire de la ferme et anime des activités avec enfants et groupes.", en: "Tells the farm's story and leads activities with children and groups." },
  },
  {
    id: "maral",
    name: "Maral",
    roleKey: "about.role.projects",
    role: { nl: 'Projectbeheerder en animator', fr: 'Gestionnaire de projet et animatrice', en: 'Project manager and facilitator' },
    subject: "Projecten & partners",
    bio: { nl: 'Werkt projecten uit met scholen en partners en begeleidt animaties op de boerderij.', fr: 'Développe des projets avec écoles et partenaires et anime des activités à la ferme.', en: 'Develops projects with schools and partners and leads activities at the farm.' },
  },
  {
    id: "jeanne",
    name: "Jeanne",
    roleKey: "about.role.projects",
    role: { nl: 'Projectbeheerder en animator', fr: 'Gestionnaire de projet et animatrice', en: 'Project manager and facilitator' },
    subject: "Educatie & schoolbezoeken",
    bio: { nl: 'Werkt projecten uit en begeleidt schoolbezoeken, stages en verjaardagsfeestjes.', fr: 'Développe des projets et anime visites scolaires, stages et anniversaires.', en: 'Develops projects and leads school visits, holiday camps and birthday parties.' },
  },
  {
    id: "foti",
    name: "Foti",
    roleKey: "about.role.site",
    role: { nl: 'Beheerder park en gebouwen, imker', fr: 'Gestionnaire du parc et des bâtiments, apiculteur', en: 'Park and buildings manager, beekeeper' },
    subject: "Sitebeheer",
    bio: { nl: 'Onderhoudt het park, de stallen en de gebouwen en helpt bij de bijen.', fr: 'Entretient le parc, les étables et les bâtiments, et aide aux ruches.', en: 'Maintains the park, barns and buildings, and helps with the bees.' },
  },
  {
    id: "kim",
    name: "Kim",
    roleKey: "about.role.site",
    role: { nl: 'Beheerder park en gebouwen', fr: 'Gestionnaire du parc et des bâtiments', en: 'Park and buildings manager' },
    subject: "Sitebeheer",
    bio: { nl: 'Zorgt dat het park, de weides en de gebouwen elke dag klaar zijn voor dieren en bezoekers.', fr: 'Veille à ce que le parc, les prairies et les bâtiments soient prêts chaque jour pour animaux et visiteurs.', en: 'Makes sure the park, paddocks and buildings are ready every day for animals and visitors.' },
  },
  {
    id: "cecile",
    name: "Cécile",
    roleKey: "about.role.animals",
    role: { nl: 'Verantwoordelijke dierenwelzijn', fr: 'Responsable bien-être animal', en: 'Animal welfare lead' },
    subject: "Dierenwelzijn",
    bio: { nl: 'Waakt over de gezondheid en het welzijn van alle dieren en volgt de dierenarts op.', fr: 'Veille à la santé et au bien-être de tous les animaux et assure le suivi vétérinaire.', en: 'Watches over the health and wellbeing of every animal and follows up with the vet.' },
  },
  {
    id: "vrijwilligers",
    name: "Vrijwilligers",
    roleKey: "about.role.volunteers.sub",
    subject: "Vrijwilligers",
    bio: { nl: "Buurtbewoners, studenten en scholen helpen wekelijks mee met verzorging, moestuin, onthaal en evenementen.", fr: "Voisins, étudiants et écoles aident chaque semaine aux soins, au potager, à l'accueil et aux événements.", en: "Neighbours, students and schools help out weekly with animal care, the garden, the welcome desk and events." },
  },
];

export const BOARD: Person[] = [
  {
    id: "azaoum",
    name: "Rachid Azaoum",
    roleKey: "about.gov.president",
    role: { nl: 'Voorzitter', fr: 'Président', en: 'President' },
    subject: "Bestuur — voorzitter",
    bio: { nl: 'Voorzitter van de raad van bestuur; vertegenwoordigt de vzw.', fr: "Président du conseil d'administration ; représente l'ASBL.", en: 'Chair of the board of directors; represents the non-profit.' },
  },
  {
    id: "boutry",
    name: "Frédéric Boutry",
    roleKey: "about.gov.member",
    role: { nl: 'Bestuurder', fr: 'Administrateur', en: 'Board member' },
    subject: "Bestuur",
    bio: { nl: 'Lid van de raad van bestuur van de vzw.', fr: "Membre du conseil d'administration de l'ASBL.", en: "Member of the non-profit's board of directors." },
  },
  {
    id: "benghallam",
    name: "Amal Benghallam",
    roleKey: "about.gov.member",
    role: { nl: 'Bestuurder', fr: 'Administratrice', en: 'Board member' },
    subject: "Bestuur",
    bio: { nl: 'Lid van de raad van bestuur van de vzw.', fr: "Membre du conseil d'administration de l'ASBL.", en: "Member of the non-profit's board of directors." },
  },
  {
    id: "goyvaerts",
    name: "Jana Goyvaerts",
    roleKey: "about.gov.member",
    role: { nl: 'Bestuurder', fr: 'Administratrice', en: 'Board member' },
    subject: "Bestuur",
    bio: { nl: 'Lid van de raad van bestuur van de vzw.', fr: "Membre du conseil d'administration de l'ASBL.", en: "Member of the non-profit's board of directors." },
  },
  {
    id: "broekaert",
    name: "Mauranne Broekaert",
    roleKey: "about.gov.member",
    role: { nl: 'Bestuurder', fr: 'Administratrice', en: 'Board member' },
    subject: "Bestuur",
    bio: { nl: 'Lid van de raad van bestuur van de vzw.', fr: "Membre du conseil d'administration de l'ASBL.", en: "Member of the non-profit's board of directors." },
  },
];
