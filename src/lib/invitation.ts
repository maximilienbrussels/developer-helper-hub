/**
 * Bewerkbare uitnodigingskaart "Ma fête champêtre" (ontwerp van de oude site).
 * Gedeeld door de editor (browser) en de bestelroute (server).
 */
export type InvitationLang = "nl" | "fr" | "en";

export type InvitationFields = {
  cardLang: InvitationLang;
  guest: string;
  child: string;
  age: string;
  date: string; // YYYY-MM-DD
  from: string; // HH:MM
  to: string;
  rsvpName: string;
  rsvpPhone: string;
  rsvpBy: string; // YYYY-MM-DD, optioneel
  note: string;
};

export const INVITATION_LIMITS = {
  guest: 40, child: 30, age: 3, rsvpName: 40, rsvpPhone: 24, note: 120,
} as const;

/** Prijzen voor gedrukte kaarten (in cent). */
export const PRINT_PRICE_PER_CARD_CENTS = 100;
export const PRINT_PACKS = [6, 12, 18, 24, 30] as const;
export const DELIVERY_CENTS = 450;
export const DELIVERY_COUNTRIES = ["BE"] as const;

export function invitationTotalCents(qty: number, delivery: "pickup" | "post"): number | null {
  if (!(PRINT_PACKS as readonly number[]).includes(qty)) return null;
  return qty * PRINT_PRICE_PER_CARD_CENTS + (delivery === "post" ? DELIVERY_CENTS : 0);
}

export const CARD_TEXT: Record<InvitationLang, {
  title: string; subtitle: string; hey: string; body: (age: string) => string;
  when: string; time: (a: string, b: string) => string; where: string; address: string;
  rsvp: string; rsvpBy: (d: string) => string; locale: string;
}> = {
  fr: {
    title: "MA FÊTE", subtitle: "CHAMPÊTRE", hey: "Hey",
    body: (a) => `je t'invite à la ferme pour venir fêter mon anniversaire et souffler tous ensemble mes ${a || "…"} bougies.`,
    when: "Quand ?", time: (a, b) => `de ${a} à ${b}`, where: "Où ?",
    address: "La Ferme du Parc Maximilien · Quai du Batelage 21 · 1000 Bruxelles",
    rsvp: "Réponse souhaitée", rsvpBy: (d) => `avant le ${d}`, locale: "fr-BE",
  },
  nl: {
    title: "MIJN FEEST", subtitle: "OP DE BOERDERIJ", hey: "Hey",
    body: (a) => `ik nodig je uit op de boerderij om mijn verjaardag te vieren en samen mijn ${a || "…"} kaarsjes uit te blazen.`,
    when: "Wanneer?", time: (a, b) => `van ${a} tot ${b}`, where: "Waar?",
    address: "Stadsboerderij Maximiliaanpark · Schipperskaai 21 · 1000 Brussel",
    rsvp: "Graag een seintje", rsvpBy: (d) => `vóór ${d}`, locale: "nl-BE",
  },
  en: {
    title: "MY FARM", subtitle: "PARTY", hey: "Hey",
    body: (a) => `I'm inviting you to the farm to celebrate my birthday and blow out my ${a || "…"} candles together.`,
    when: "When?", time: (a, b) => `from ${a} to ${b}`, where: "Where?",
    address: "Maximilien Park City Farm · Quai du Batelage 21 · 1000 Brussels",
    rsvp: "Please RSVP", rsvpBy: (d) => `by ${d}`, locale: "en-GB",
  },
};

export function formatCardDate(iso: string, lang: InvitationLang): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(CARD_TEXT[lang].locale, { weekday: "long", day: "numeric", month: "long" });
}
