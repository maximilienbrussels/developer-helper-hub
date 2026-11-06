/**
 * Peter/Meterschap — tarieven per soort (overgenomen van de oude site, per
 * jaar) met een maandelijkse variant. Browser-veilig: de server leest dezelfde
 * lijst, zodat het bedrag nooit uit de browser komt.
 */

export type SponsorLang = "nl" | "fr" | "en";

export type SponsorCategoryId =
  | "alpaca"
  | "ezel-pony"
  | "bijenkorf"
  | "geit-schaap"
  | "fruitboom"
  | "klein-dier";

export type SponsorCategory = {
  id: SponsorCategoryId;
  yearlyEur: number;
  /** Geen individueel dier in de databank (bijenkorf, fruitboom). */
  standalone: boolean;
  label: Record<SponsorLang, string>;
};

export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  { id: "alpaca", yearlyEur: 250, standalone: false, label: { nl: "Alpaca", fr: "Alpaga", en: "Alpaca" } },
  { id: "bijenkorf", yearlyEur: 200, standalone: true, label: { nl: "Bijenkorf", fr: "Ruche", en: "Beehive" } },
  { id: "ezel-pony", yearlyEur: 100, standalone: false, label: { nl: "Ezel of pony", fr: "Âne ou poney", en: "Donkey or pony" } },
  { id: "geit-schaap", yearlyEur: 50, standalone: false, label: { nl: "Geit of schaap", fr: "Chèvre ou mouton", en: "Goat or sheep" } },
  { id: "fruitboom", yearlyEur: 25, standalone: true, label: { nl: "Fruitboom", fr: "Arbre fruitier", en: "Fruit tree" } },
  { id: "klein-dier", yearlyEur: 15, standalone: false, label: { nl: "Klein dier (kip, konijn, eend, gans…)", fr: "Petit animal (poule, lapin, canard, oie…)", en: "Small animal (hen, rabbit, duck, goose…)" } },
];

/** Maandbedrag: jaarprijs / 12, afgerond naar boven op een hele euro (min. 2 €). */
export function monthlyEur(yearlyEur: number): number {
  return Math.max(2, Math.ceil(yearlyEur / 12));
}

/** Welke categorie hoort bij een soortnaam uit de dierenlijst. */
export function categoryForSpecies(species: string): SponsorCategoryId {
  const s = species.toLowerCase();
  if (/alpa/.test(s)) return "alpaca";
  if (/ezel|âne|ane\b|donkey|pon(y|ey)|paard|cheval|horse/.test(s)) return "ezel-pony";
  if (/geit|chèvre|chevre|goat|schaap|schapen|mouton|sheep|brebis|bélier/.test(s)) return "geit-schaap";
  return "klein-dier";
}

export type SponsorTier = {
  id: string;
  amountCents: number;
  interval: "month" | "year";
  label: Record<SponsorLang, string>;
  /** Oude formules blijven geldig voor bestaande certificaten, maar zijn niet meer kiesbaar. */
  legacy?: boolean;
};

function fmt(eur: number, interval: "month" | "year"): Record<SponsorLang, string> {
  return interval === "year"
    ? { nl: `€${eur} / jaar`, fr: `${eur} € / an`, en: `€${eur} / year` }
    : { nl: `€${eur} / maand`, fr: `${eur} € / mois`, en: `€${eur} / month` };
}

export const SPONSOR_TIERS: SponsorTier[] = [
  ...SPONSOR_CATEGORIES.flatMap((c): SponsorTier[] => [
    { id: `${c.id}-year`, amountCents: c.yearlyEur * 100, interval: "year", label: fmt(c.yearlyEur, "year") },
    {
      id: `${c.id}-month`,
      amountCents: monthlyEur(c.yearlyEur) * 100,
      interval: "month",
      label: fmt(monthlyEur(c.yearlyEur), "month"),
    },
  ]),
  { id: "basis", amountCents: 500, interval: "month", label: fmt(5, "month"), legacy: true },
  { id: "vriend", amountCents: 1000, interval: "month", label: fmt(10, "month"), legacy: true },
  { id: "beschermer", amountCents: 5000, interval: "year", label: fmt(50, "year"), legacy: true },
];

export function tierById(id: string): SponsorTier | null {
  return SPONSOR_TIERS.find((t) => t.id === id) ?? null;
}

export function tierFor(category: SponsorCategoryId, interval: "month" | "year"): SponsorTier {
  return tierById(`${category}-${interval}`)!;
}
