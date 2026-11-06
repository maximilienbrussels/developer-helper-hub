/**
 * Serverfuncties voor evenement-inschrijvingen.
 * Publiek: agenda lezen, gratis inschrijven, annuleren via token.
 * Beheer (manage_calendar): inschrijvingsinstellingen en deelnemerslijst.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

const lang = z.enum(["nl", "fr", "en"]);

export const listPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return [];
  const { listUpcomingPublicEvents } = await import("./event-signup.server");
  try {
    return await listUpcomingPublicEvents();
  } catch (err) {
    console.error("[events] agenda laden mislukt", err);
    return [];
  }
});

export const registrationSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).default(""),
  seats: z.number().int().min(1).max(8),
  note: z.string().trim().max(500).default(""),
  lang,
  allowWaitlist: z.boolean().default(true),
  website_hp: z.string().max(200).optional(),
});

/** Gratis evenement: meteen bevestigd of op de wachtlijst. */
export const registerForEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => registrationSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website_hp?.trim()) return { ok: true as const, status: "confirmed" as const };
    await (await import("./email-guard.server")).guardRate("event-signup", data.email);
    const { registerAtomic, sendRegistrationMail } = await import("./event-signup.server");
    const res = await registerAtomic({ ...data, paid: false });
    if (!res.ok) return { ok: false as const, reason: res.reason };
    await sendRegistrationMail(res.id, res.status === "waitlist" ? "waitlist" : "confirmed").catch((e) =>
      console.error("[events] bevestigingsmail mislukt", e),
    );
    return { ok: true as const, status: res.status };
  });

export const cancelRegistration = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string().regex(/^[a-f0-9]{20,80}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { cancelByToken } = await import("./event-signup.server");
    return cancelByToken(data.token);
  });

/* ------------------------------------------------------------ beheer */

export type EventSignupSettings = {
  descriptionNl: string;
  descriptionFr: string;
  descriptionEn: string;
  capacity: number | null;
  priceCents: number;
  registrationOpen: boolean;
  audience: string;
};

export type AdminRegistration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  seats: number;
  note: string;
  status: "confirmed" | "pending" | "waitlist" | "cancelled";
  amountCents: number;
  createdAt: string;
};

export const getEventSignupAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "view_calendar");
    const { ensureEventSignupSchema } = await import("./event-signup.server");
    const { db } = await import("./neon.server");
    await ensureEventSignupSchema();
    const sql = db();
    const ev = (await sql`
      select description_nl, description_fr, description_en, capacity, price_cents, registration_open, audience
      from events where id = ${data.eventId}::uuid
    `) as Array<Record<string, unknown>>;
    const regs = (await sql`
      select id::text as id, name, email, phone, seats, note, status, amount_cents, created_at::text as created_at
      from event_registrations where event_id = ${data.eventId}::uuid
      order by case status when 'confirmed' then 0 when 'pending' then 1 when 'waitlist' then 2 else 3 end, created_at
    `) as Array<Record<string, unknown>>;
    const e = ev[0] ?? {};
    const settings: EventSignupSettings = {
      descriptionNl: String(e.description_nl ?? ""),
      descriptionFr: String(e.description_fr ?? ""),
      descriptionEn: String(e.description_en ?? ""),
      capacity: e.capacity == null ? null : Number(e.capacity),
      priceCents: Number(e.price_cents ?? 0),
      registrationOpen: Boolean(e.registration_open),
      audience: String(e.audience ?? ""),
    };
    const registrations: AdminRegistration[] = regs.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
      phone: String(r.phone ?? ""),
      seats: Number(r.seats),
      note: String(r.note ?? ""),
      status: r.status as AdminRegistration["status"],
      amountCents: Number(r.amount_cents ?? 0),
      createdAt: String(r.created_at),
    }));
    return { settings, registrations };
  });

export const saveEventSignupAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        eventId: z.string().uuid(),
        descriptionNl: z.string().max(2000),
        descriptionFr: z.string().max(2000),
        descriptionEn: z.string().max(2000),
        capacity: z.number().int().min(1).max(5000).nullable(),
        priceCents: z.number().int().min(0).max(100000),
        registrationOpen: z.boolean(),
        audience: z.string().max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const { ensureEventSignupSchema, promoteWaitlist } = await import("./event-signup.server");
    const { db } = await import("./neon.server");
    await ensureEventSignupSchema();
    await db()`
      update events set description_nl = ${data.descriptionNl}, description_fr = ${data.descriptionFr},
        description_en = ${data.descriptionEn}, capacity = ${data.capacity}, price_cents = ${data.priceCents},
        registration_open = ${data.registrationOpen}, audience = ${data.audience}, updated_at = now()
      where id = ${data.eventId}::uuid
    `;
    // Meer plaatsen? Dan schuift de wachtlijst meteen door.
    await promoteWaitlist(data.eventId);
    return { ok: true };
  });

export const adminCancelRegistration = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const { promoteWaitlist } = await import("./event-signup.server");
    const { db } = await import("./neon.server");
    const rows = (await db()`
      update event_registrations set status = 'cancelled', updated_at = now()
      where id = ${data.id}::uuid returning event_id::text as event_id
    `) as Array<{ event_id: string }>;
    if (rows[0]) await promoteWaitlist(rows[0].event_id);
    return { ok: true };
  });
