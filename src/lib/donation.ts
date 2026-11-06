/**
 * Giften — gedeelde regels voor browser en server.
 *
 * Twee wegen, met een bewust verschil:
 * - Overschrijving via Service Arc-en-Ciel (project n°156): vanaf 40 € per
 *   kalenderjaar fiscaal aftrekbaar; Arc-en-Ciel stuurt het attest.
 * - Online met kaart/Bancontact (eenmalig of maandelijks): komt rechtstreeks
 *   bij de vzw toe en geeft géén fiscaal attest.
 */

export const ARC_EN_CIEL = {
  beneficiary: "Service Arc-en-Ciel asbl",
  address: "Rue du Bien Faire 41, 1170 Bruxelles",
  iban: "BE41 6300 1180 0010",
  bic: "BBRUBEBB",
  communication: "Don au Projet n°156",
  /** Minimum per kalenderjaar voor een fiscaal attest. */
  taxMinimumEur: 40,
} as const;

export type DonationFrequency = "once" | "monthly";

/** Voorgestelde bedragen in euro. */
export const DONATION_PRESETS: Record<DonationFrequency, number[]> = {
  once: [25, 50, 100, 250],
  monthly: [5, 10, 20, 40],
};

export const DONATION_MIN_EUR = 5;
export const DONATION_MAX_EUR = 5000;

/** Bedrag in centen valideren; geeft null bij een ongeldig bedrag. */
export function donationCents(amountEur: number): number | null {
  if (!Number.isFinite(amountEur)) return null;
  const cents = Math.round(amountEur * 100);
  if (cents < DONATION_MIN_EUR * 100 || cents > DONATION_MAX_EUR * 100) return null;
  return cents;
}

/** Wat een bedrag concreet betekent op de boerderij (voor de "impact"-regel). */
export function donationImpact(amountEur: number, freq: DonationFrequency, lang: "nl" | "fr" | "en"): string {
  const yearly = freq === "monthly" ? amountEur * 12 : amountEur;
  const weeksHay = Math.max(1, Math.round(yearly / 25));
  const L = {
    nl: freq === "monthly"
      ? `= ${yearly} € per jaar, of ongeveer ${weeksHay} weken hooi en granen voor de ezels.`
      : `≈ ${weeksHay} ${weeksHay === 1 ? "week" : "weken"} hooi en granen voor de ezels.`,
    fr: freq === "monthly"
      ? `= ${yearly} € par an, soit environ ${weeksHay} semaines de foin et de céréales pour les ânes.`
      : `≈ ${weeksHay} semaine${weeksHay === 1 ? "" : "s"} de foin et de céréales pour les ânes.`,
    en: freq === "monthly"
      ? `= €${yearly} a year, or about ${weeksHay} weeks of hay and grain for the donkeys.`
      : `≈ ${weeksHay} week${weeksHay === 1 ? "" : "s"} of hay and grain for the donkeys.`,
  };
  return L[lang];
}
