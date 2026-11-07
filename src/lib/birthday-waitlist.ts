/**
 * Wachtlijst voor kinderfeestjes — gedeelde regels voor browser en server.
 * Feestjes vinden alleen op woensdag of zaterdag plaats (zoals op de oude site).
 */
import { z } from "zod";
import { BIRTHDAY_PACKAGES } from "./birthday-packages";

export const WAITLIST_MAX_ALTERNATIVES = 5;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Weekdag van een ISO-datum, los van de tijdzone van de server. */
export function isoWeekday(iso: string): number {
  if (!ISO.test(iso)) return NaN;
  const [y, m, d] = iso.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return NaN;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return NaN;
  return date.getUTCDay();
}

/** Mag deze datum voor dit pakket (juiste weekdag, niet in het verleden)? */
export function isValidWaitlistDate(iso: string, packageSlug: string, todayIso: string): boolean {
  if (!ISO.test(iso)) return false;
  const pkg = BIRTHDAY_PACKAGES.find((p) => p.slug === packageSlug);
  if (!pkg) return false;
  if (iso < todayIso) return false;
  return isoWeekday(iso) === pkg.weekday;
}

export const waitlistSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160),
  packageSlug: z.string().max(40),
  date: z.string().regex(ISO),
  alternatives: z.array(z.string().regex(ISO)).max(WAITLIST_MAX_ALTERNATIVES),
  children: z.number().int().min(1).max(40).optional(),
  note: z.string().trim().max(1500).optional(),
  website_hp: z.string().max(200).optional(),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

/** Controleert alle data; geeft de eerste fout terug of null. */
export function waitlistDateError(input: WaitlistInput, todayIso: string): string | null {
  if (!isValidWaitlistDate(input.date, input.packageSlug, todayIso)) return "date";
  const seen = new Set([input.date]);
  for (const a of input.alternatives) {
    if (!isValidWaitlistDate(a, input.packageSlug, todayIso) || seen.has(a)) return "alternatives";
    seen.add(a);
  }
  return null;
}

/** Shares the party's published capacity with the waiting-list form. */
export function waitlistChildrenLimit(packageSlug: string): number | undefined {
  const pkg = BIRTHDAY_PACKAGES.find((p) => p.slug === packageSlug);
  return pkg?.maxChildren ?? pkg?.maxGuests ?? undefined;
}

export function waitlistChildrenError(input: WaitlistInput): boolean {
  const limit = waitlistChildrenLimit(input.packageSlug);
  return input.children !== undefined && (limit === undefined || input.children > limit);
}
