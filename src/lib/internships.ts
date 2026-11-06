/**
 * Studentenstages — zes domeinen, overgenomen van de oude site
 * (lafermeduparcmaximilien.be/stage/…), met foto en praktische info.
 */
import { OLD_ASSETS } from "@/lib/old-site-assets";

type Tri = { nl: string; fr: string; en: string };

export type Internship = {
  id: string;
  photo: string;
  title: Tri;
  tagline: Tri;
  body: Tri;
  /** Praktische voorwaarde die de kandidaat moet bevestigen. */
  requirement?: Tri;
  location?: string;
};

export const INTERNSHIPS: Internship[] = [
  {
    id: "dierenverzorging",
    photo: OLD_ASSETS.stageDierenverzorging,
    title: { nl: "Dierenverzorging", fr: "Soin animalier", en: "Animal care" },
    tagline: { nl: "Leer dieren verzorgen samen met ons team.", fr: "Apprendre le soin animalier auprès de notre équipe.", en: "Learn animal care alongside our team." },
    body: { nl: "Voor studenten dierenzorg, agronomie of een verwant domein.", fr: "Pour les étudiant·es en soin animalier, agronomie ou domaine proche.", en: "For students in animal care, agronomy or a related field." },
  },
  {
    id: "groenteteelt",
    photo: OLD_ASSETS.stageGroenteteelt,
    title: { nl: "Groenteteelt", fr: "Maraîchage", en: "Market gardening" },
    tagline: { nl: "Met je handen in de aarde, in de serres van Sterrebeek.", fr: "Les mains dans la terre, aux Serres de Sterrebeek.", en: "Hands in the soil, at the Sterrebeek greenhouses." },
    body: { nl: "Deze stage loopt 3 dagen per week in de Serres van Sterrebeek, Zavelstraat 95, 1933 Zaventem. Eigen vervoer is nodig.", fr: "Le stage se déroule aux Serres de Sterrebeek, Zavelstraat 95, 1933 Zaventem, 3 jours par semaine. Un moyen de transport personnel est indispensable.", en: "This internship runs 3 days a week at the Sterrebeek greenhouses, Zavelstraat 95, 1933 Zaventem. You need your own transport." },
    requirement: { nl: "Ik kan 3 dagen per week op tijd in de Serres van Sterrebeek (Zavelstraat 95, 1933 Zaventem) zijn, met eigen vervoer.", fr: "J'atteste pouvoir me rendre 3 jours par semaine, à l'heure, aux Serres de Sterrebeek (Zavelstraat 95, 1933 Zaventem) par mes propres moyens.", en: "I can be at the Sterrebeek greenhouses (Zavelstraat 95, 1933 Zaventem) on time 3 days a week, with my own transport." },
    location: "Serres de Sterrebeek",
  },
  {
    id: "imkerij",
    photo: OLD_ASSETS.stageImkerijDak,
    title: { nl: "Imkerij", fr: "Apiculture", en: "Beekeeping" },
    tagline: { nl: "Ontdek de wereld van de bijen bij onze korven op het dak.", fr: "Découvrir le monde des abeilles auprès de nos ruches.", en: "Discover the world of bees at our rooftop hives." },
    body: { nl: "Leer imkeren in hartje Brussel, met zicht op de stad.", fr: "S'initier à l'apiculture au cœur de Bruxelles, avec vue sur la ville.", en: "Learn beekeeping in the heart of Brussels, overlooking the city." },
  },
  {
    id: "onderhoud",
    photo: OLD_ASSETS.stageOnderhoud,
    title: { nl: "Onderhoud en stadslandbouw", fr: "Entretien et agriculture urbaine", en: "Upkeep and urban farming" },
    tagline: { nl: "Groen onderhouden en telen in volle stad.", fr: "Entretenir les espaces et cultiver en pleine ville.", en: "Look after green spaces and grow food in the city." },
    body: { nl: "Help mee met het onderhoud van de groene ruimtes en de teelten.", fr: "Participer à l'entretien de nos espaces verts et de nos cultures.", en: "Help maintain our green spaces and crops." },
  },
  {
    id: "projectbeheer",
    photo: OLD_ASSETS.stageProjectbeheer,
    title: { nl: "Animatie en projectbeheer", fr: "Animation et gestion de projet", en: "Facilitation and project management" },
    tagline: { nl: "Projecten bedenken en begeleiden op de boerderij.", fr: "Concevoir et animer des projets au cœur de la ferme.", en: "Design and run projects at the farm." },
    body: { nl: "Voor studenten animatie, onderwijs of projectbeheer: bedenk, organiseer en begeleid onze activiteiten.", fr: "Pour les étudiant·es en animation, éducation ou gestion de projet : imaginer, organiser et faire vivre nos activités.", en: "For students in facilitation, education or project management: design, organise and run our activities." },
  },
  {
    id: "administratie",
    photo: OLD_ASSETS.stageAdministratie,
    title: { nl: "Administratie en HR", fr: "Gestion administrative et RH", en: "Administration and HR" },
    tagline: { nl: "Ontdek hoe een vzw achter de schermen draait.", fr: "Découvrir les coulisses administratives d'une ferme urbaine.", en: "See how a non-profit runs behind the scenes." },
    body: { nl: "Voor studenten management, administratie of HR.", fr: "Pour les étudiant·es en gestion, administration ou RH.", en: "For students in management, administration or HR." },
  },
];

export const INTERNSHIP_WEEKDAYS = ["ma", "di", "wo", "do", "vr"] as const;
export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
