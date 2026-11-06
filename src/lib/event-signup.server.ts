/**
 * Inschrijvingen voor publieke evenementen (wandelingen, workshops, open dagen).
 *
 * - Het schema wordt zelf aangevuld (kolommen op `events`, tabel `event_registrations`).
 * - Plaatsen worden atomair toegekend: de evenementrij wordt vergrendeld
 *   (`for update`) in dezelfde instructie die de inschrijving toevoegt, zodat
 *   twee gelijktijdige inschrijvingen nooit samen de capaciteit overschrijden.
 * - Volzet → wachtlijst. Bij een annulering schuift de eerste op de wachtlijst
 *   automatisch door (enkel gratis evenementen; betalende krijgen een mail).
 * - Betalende inschrijvingen blijven 30 minuten "pending" tot Stripe bevestigt.
 */
import { db } from "./neon.server";

export type RegStatus = "confirmed" | "pending" | "waitlist" | "cancelled";
export type SignupLang = "nl" | "fr" | "en";

export const PENDING_MINUTES = 30;
export const MAX_SEATS_PER_REG = 8;

let ensured = false;
export async function ensureEventSignupSchema(): Promise<void> {
  if (ensured) return;
  const sql = db();
  await sql`alter table events add column if not exists description_nl text not null default ''`;
  await sql`alter table events add column if not exists description_fr text not null default ''`;
  await sql`alter table events add column if not exists description_en text not null default ''`;
  await sql`alter table events add column if not exists capacity integer`;
  await sql`alter table events add column if not exists price_cents integer not null default 0`;
  await sql`alter table events add column if not exists registration_open boolean not null default false`;
  await sql`alter table events add column if not exists audience text not null default ''`;
  await sql`alter table events add column if not exists image_url text`;
  await sql`
    create table if not exists event_registrations (
      id uuid primary key default gen_random_uuid(),
      event_id uuid not null references events(id) on delete cascade,
      name text not null,
      email text not null,
      phone text not null default '',
      seats integer not null check (seats between 1 and 20),
      note text not null default '',
      lang text not null default 'nl',
      status text not null check (status in ('confirmed','pending','waitlist','cancelled')),
      amount_cents integer not null default 0,
      stripe_session_id text,
      cancel_token text not null unique default encode(gen_random_bytes(18), 'hex'),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists event_registrations_event_idx on event_registrations(event_id, status)`;
  ensured = true;
}

/** Plaatsen die nu bezet zijn (bevestigd + recente, nog niet vervallen betalingen). */
export const TAKEN_SQL_NOTE = "confirmed + pending younger than PENDING_MINUTES";

export type PublicEvent = {
  id: string;
  title: Record<SignupLang, string>;
  description: Record<SignupLang, string>;
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
  capacity: number | null;
  seatsLeft: number | null;
  priceCents: number;
  registrationOpen: boolean;
  audience: string;
  imageUrl: string | null;
};

export async function listUpcomingPublicEvents(): Promise<PublicEvent[]> {
  await ensureEventSignupSchema();
  const rows = (await db()`
    select e.id::text as id, e.title_nl, e.title_fr, e.title_en,
           e.description_nl, e.description_fr, e.description_en,
           e.event_date::text as event_date, e.start_time::text as start_time, e.end_time::text as end_time,
           e.location_id, e.capacity, e.price_cents, e.registration_open, e.audience, e.image_url,
           coalesce((select sum(r.seats) from event_registrations r
                      where r.event_id = e.id and (r.status = 'confirmed'
                        or (r.status = 'pending' and r.created_at > now() - make_interval(mins => ${PENDING_MINUTES})))), 0)::int as taken
    from events e
    where e.is_public and e.event_date >= (now() at time zone 'Europe/Brussels')::date
    order by e.event_date, e.start_time
    limit 60
  `) as Array<Record<string, unknown>>;
  return rows.map((r) => {
    const cap = r.capacity == null ? null : Number(r.capacity);
    return {
      id: String(r.id),
      title: { nl: String(r.title_nl), fr: String(r.title_fr), en: String(r.title_en) },
      description: { nl: String(r.description_nl ?? ""), fr: String(r.description_fr ?? ""), en: String(r.description_en ?? "") },
      date: String(r.event_date),
      startTime: String(r.start_time).slice(0, 5),
      endTime: String(r.end_time).slice(0, 5),
      locationId: String(r.location_id),
      capacity: cap,
      seatsLeft: cap == null ? null : Math.max(0, cap - Number(r.taken)),
      priceCents: Number(r.price_cents ?? 0),
      registrationOpen: Boolean(r.registration_open),
      audience: String(r.audience ?? ""),
      imageUrl: (r.image_url as string | null) ?? null,
    };
  });
}

export type RegisterInput = {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  seats: number;
  note: string;
  lang: SignupLang;
  /** true = betaalde inschrijving (eerst pending). */
  paid: boolean;
  /** Mag op de wachtlijst als het volzet is. */
  allowWaitlist: boolean;
};

export type RegisterResult =
  | { ok: true; id: string; status: RegStatus; cancelToken: string; amountCents: number; event: EventRow }
  | { ok: false; reason: "not_found" | "closed" | "full" | "past" | "duplicate" };

export type EventRow = {
  id: string; title_nl: string; title_fr: string; title_en: string; event_date: string;
  start_time: string; end_time: string; location_id: string; capacity: number | null; price_cents: number;
};

/**
 * Atomaire inschrijving: vergrendelt de evenementrij, telt bezette plaatsen en
 * voegt in één instructie de inschrijving toe als confirmed/pending of waitlist.
 */
export async function registerAtomic(input: RegisterInput): Promise<RegisterResult> {
  await ensureEventSignupSchema();
  const sql = db();
  const evRows = (await sql`
    select id::text as id, title_nl, title_fr, title_en, event_date::text as event_date,
           start_time::text as start_time, end_time::text as end_time, location_id, capacity, price_cents,
           registration_open, is_public,
           event_date < (now() at time zone 'Europe/Brussels')::date as is_past
    from events where id = ${input.eventId}::uuid
  `) as Array<EventRow & { registration_open: boolean; is_public: boolean; is_past: boolean }>;
  const ev = evRows[0];
  if (!ev || !ev.is_public) return { ok: false, reason: "not_found" };
  if (ev.is_past) return { ok: false, reason: "past" };
  if (!ev.registration_open) return { ok: false, reason: "closed" };
  if (input.paid !== ev.price_cents > 0) return { ok: false, reason: "closed" };

  const dup = (await sql`
    select 1 from event_registrations
    where event_id = ${input.eventId}::uuid and lower(email) = lower(${input.email})
      and (status in ('confirmed','waitlist')
        or (status = 'pending' and created_at > now() - make_interval(mins => ${PENDING_MINUTES})))
    limit 1
  `) as unknown[];
  if (dup.length) return { ok: false, reason: "duplicate" };

  const amount = ev.price_cents * input.seats;
  const firstStatus: RegStatus = input.paid ? "pending" : "confirmed";
  const rows = (await sql`
    with ev as (
      select id, capacity from events where id = ${input.eventId}::uuid for update
    ), taken as (
      select coalesce(sum(seats), 0)::int as n from event_registrations
      where event_id = ${input.eventId}::uuid and (status = 'confirmed'
        or (status = 'pending' and created_at > now() - make_interval(mins => ${PENDING_MINUTES})))
    ), decided as (
      select case
        when ev.capacity is null or taken.n + ${input.seats} <= ev.capacity then ${firstStatus}
        when ${input.allowWaitlist} then 'waitlist'
        else null end as status
      from ev, taken
    )
    insert into event_registrations (event_id, name, email, phone, seats, note, lang, status, amount_cents)
    select ${input.eventId}::uuid, ${input.name}, ${input.email}, ${input.phone}, ${input.seats},
           ${input.note}, ${input.lang}, decided.status, ${amount}
    from decided where decided.status is not null
    returning id::text as id, status, cancel_token
  `) as Array<{ id: string; status: RegStatus; cancel_token: string }>;
  const r = rows[0];
  if (!r) return { ok: false, reason: "full" };
  return { ok: true, id: r.id, status: r.status, cancelToken: r.cancel_token, amountCents: amount, event: ev };
}

/** Annuleert via de persoonlijke link en laat de wachtlijst doorschuiven. */
export async function cancelByToken(token: string): Promise<{ ok: boolean; title?: string; already?: boolean }> {
  await ensureEventSignupSchema();
  const sql = db();
  const rows = (await sql`
    select r.id::text as id, r.status, r.event_id::text as event_id, e.title_nl,
           e.event_date < (now() at time zone 'Europe/Brussels')::date as is_past
    from event_registrations r join events e on e.id = r.event_id
    where r.cancel_token = ${token}
  `) as Array<{ id: string; status: RegStatus; event_id: string; title_nl: string; is_past: boolean }>;
  const r = rows[0];
  if (!r || r.is_past) return { ok: false };
  if (r.status === "cancelled") return { ok: true, already: true, title: r.title_nl };
  await sql`update event_registrations set status = 'cancelled', updated_at = now() where id = ${r.id}::uuid`;
  await promoteWaitlist(r.event_id);
  return { ok: true, title: r.title_nl };
}

/** Schuift wachtlijst door zolang er plaats is (FIFO). */
export async function promoteWaitlist(eventId: string): Promise<void> {
  const sql = db();
  for (let guard = 0; guard < 20; guard++) {
    const rows = (await sql`
      with ev as (select id, capacity, price_cents from events where id = ${eventId}::uuid for update),
      taken as (
        select coalesce(sum(seats), 0)::int as n from event_registrations
        where event_id = ${eventId}::uuid and (status = 'confirmed'
          or (status = 'pending' and created_at > now() - make_interval(mins => ${PENDING_MINUTES})))
      ),
      nxt as (
        select r.id from event_registrations r, ev, taken
        where r.event_id = ${eventId}::uuid and r.status = 'waitlist' and ev.price_cents = 0
          and (ev.capacity is null or taken.n + r.seats <= ev.capacity)
        order by r.created_at limit 1
      )
      update event_registrations set status = 'confirmed', updated_at = now()
      where id in (select id from nxt)
      returning id::text as id
    `) as Array<{ id: string }>;
    if (!rows[0]) break;
    await sendRegistrationMail(rows[0].id, "promoted").catch((e) => console.error("[events] mail doorschuiven", e));
  }
}

/** Bevestigt een betaalde inschrijving na Stripe. */
export async function confirmPaidRegistration(regId: string, sessionId: string): Promise<void> {
  await ensureEventSignupSchema();
  const rows = (await db()`
    update event_registrations set status = 'confirmed', stripe_session_id = ${sessionId}, updated_at = now()
    where id = ${regId}::uuid and status in ('pending','cancelled')
    returning id::text as id
  `) as Array<{ id: string }>;
  if (rows[0]) await sendRegistrationMail(rows[0].id, "confirmed");
}

const MAIL: Record<SignupLang, {
  confirmed: string; waitlist: string; promoted: string; intro: Record<"confirmed" | "waitlist" | "promoted", string>;
  when: string; seats: string; paid: string; cancel: string; cancelHint: string;
}> = {
  nl: {
    confirmed: "Je inschrijving is bevestigd", waitlist: "Je staat op de wachtlijst", promoted: "Er is een plaats vrijgekomen — je bent ingeschreven",
    intro: { confirmed: "Fijn dat je erbij bent! Hieronder vind je alle gegevens.", waitlist: "Het evenement is momenteel volzet. Komt er een plaats vrij, dan schrijven we je automatisch in en krijg je een mail.", promoted: "Goed nieuws: iemand heeft geannuleerd en jij bent nu ingeschreven." },
    when: "Wanneer", seats: "Aantal plaatsen", paid: "Betaald", cancel: "Inschrijving annuleren", cancelHint: "Kan je toch niet komen? Annuleer dan even, zo geef je je plaats aan iemand op de wachtlijst.",
  },
  fr: {
    confirmed: "Ton inscription est confirmée", waitlist: "Tu es sur la liste d'attente", promoted: "Une place s'est libérée — tu es inscrit·e",
    intro: { confirmed: "Ravi·es de te compter parmi nous ! Voici toutes les informations.", waitlist: "L'événement est complet pour l'instant. Si une place se libère, nous t'inscrivons automatiquement et t'envoyons un e-mail.", promoted: "Bonne nouvelle : quelqu'un a annulé et tu es maintenant inscrit·e." },
    when: "Quand", seats: "Nombre de places", paid: "Payé", cancel: "Annuler l'inscription", cancelHint: "Tu ne peux finalement pas venir ? Annule pour laisser ta place à quelqu'un sur la liste d'attente.",
  },
  en: {
    confirmed: "Your registration is confirmed", waitlist: "You're on the waiting list", promoted: "A place opened up — you're registered",
    intro: { confirmed: "Great to have you! Here are all the details.", waitlist: "The event is currently full. If a place opens up, we'll register you automatically and e-mail you.", promoted: "Good news: someone cancelled and you are now registered." },
    when: "When", seats: "Places", paid: "Paid", cancel: "Cancel registration", cancelHint: "Can't make it after all? Please cancel so someone on the waiting list gets your place.",
  },
};

export async function sendRegistrationMail(regId: string, kind: "confirmed" | "waitlist" | "promoted"): Promise<void> {
  const rows = (await db()`
    select r.name, r.email, r.seats, r.lang, r.amount_cents, r.cancel_token,
           e.title_nl, e.title_fr, e.title_en, e.event_date::text as event_date,
           e.start_time::text as start_time, e.end_time::text as end_time
    from event_registrations r join events e on e.id = r.event_id where r.id = ${regId}::uuid
  `) as Array<Record<string, string | number>>;
  const r = rows[0];
  if (!r) return;
  const lang = (["nl", "fr", "en"].includes(String(r.lang)) ? r.lang : "nl") as SignupLang;
  const m = MAIL[lang];
  const { shell, escapeHtml, infoGrid, button, mailOrigin } = await import("./email-shell");
  const { sendMail } = await import("./email.server");
  const title = String(r[`title_${lang}`] || r.title_nl);
  const d = new Date(`${r.event_date}T12:00:00`).toLocaleDateString(lang === "nl" ? "nl-BE" : lang === "fr" ? "fr-BE" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const cells = [
    { label: m.when, value: `${d} · ${String(r.start_time).slice(0, 5)}–${String(r.end_time).slice(0, 5)}` },
    { label: m.seats, value: String(r.seats) },
    ...(Number(r.amount_cents) > 0 && kind !== "waitlist" ? [{ label: m.paid, value: `€ ${(Number(r.amount_cents) / 100).toFixed(2).replace(".", ",")}` }] : []),
  ];
  const cancelUrl = `${mailOrigin()}/inschrijving/annuleren?token=${encodeURIComponent(String(r.cancel_token))}`;
  const subject = `${m[kind]} — ${title}`;
  const html = shell({
    preview: subject,
    kicker: title,
    title: m[kind],
    lang,
    body: `<p>${escapeHtml(m.intro[kind])}</p>${infoGrid(cells.map((c) => ({ label: escapeHtml(c.label), value: escapeHtml(c.value) })))}
      <p style="margin-top:20px">${escapeHtml(m.cancelHint)}</p>${button(cancelUrl, m.cancel, "forest")}`,
  });
  await sendMail({ to: String(r.email), subject, html, transactional: true, kind: "event-registration" });
}
