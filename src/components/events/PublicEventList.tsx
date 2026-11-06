import { useEffect, useState } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, CheckCircle2, Clock, Loader2, MapPin, Minus, Plus, Ticket, Users } from "lucide-react";
import { useT, localeFor, type Lang } from "@/lib/i18n";
import { listPublicEvents, registerForEvent } from "@/lib/event-signup.functions";
import type { PublicEvent } from "@/lib/event-signup.server";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const publicEventsQO = queryOptions({
  queryKey: ["public-events"],
  queryFn: () => listPublicEvents(),
  staleTime: 60_000,
});

const LOC: Record<string, Record<Lang, string>> = {
  chalet: { nl: "Het chalet", fr: "Le chalet", en: "The chalet" },
  zaal: { nl: "De zaal", fr: "La salle", en: "The hall" },
  prairie: { nl: "De weide", fr: "La prairie", en: "The meadow" },
  boerderij: { nl: "De boerderij", fr: "La ferme", en: "The farm" },
};

const C: Record<Lang, Record<string, string>> = {
  nl: { title: "Evenementen", free: "Gratis", per: "per persoon", left: "plaatsen vrij", few: "Nog maar {n} plaatsen", full: "Volzet — wachtlijst", register: "Inschrijven", waitlist: "Op de wachtlijst", noReg: "Vrij toegankelijk", ics: "In mijn agenda", name: "Naam", email: "E-mail", phone: "Telefoon (optioneel)", seats: "Aantal personen", note: "Opmerking (optioneel)", total: "Totaal", confirm: "Inschrijving bevestigen", pay: "Verder naar betalen", okTitle: "Je bent ingeschreven!", okBody: "We stuurden een bevestiging naar je e-mail, met een link om te annuleren.", wlTitle: "Je staat op de wachtlijst", wlBody: "Komt er een plaats vrij, dan schrijven we je automatisch in en krijg je een mail.", paidOk: "Bedankt! Je betaling is gelukt; de bevestiging zit in je mailbox.", paidCancel: "De betaling werd afgebroken. Je plaats wordt na 30 minuten weer vrijgegeven.", err_full: "Helaas, het is net volzet.", err_duplicate: "Met dit e-mailadres ben je al ingeschreven.", err_closed: "De inschrijvingen zijn gesloten.", err_past: "Dit evenement is voorbij.", err_generic: "Inschrijven lukte niet. Probeer opnieuw of mail ons.", close: "Sluiten", audience: "Voor" },
  fr: { title: "Événements", free: "Gratuit", per: "par personne", left: "places libres", few: "Plus que {n} places", full: "Complet — liste d'attente", register: "S'inscrire", waitlist: "Liste d'attente", noReg: "Accès libre", ics: "Dans mon agenda", name: "Nom", email: "E-mail", phone: "Téléphone (facultatif)", seats: "Nombre de personnes", note: "Remarque (facultatif)", total: "Total", confirm: "Confirmer l'inscription", pay: "Continuer vers le paiement", okTitle: "Tu es inscrit·e !", okBody: "Nous t'avons envoyé une confirmation par e-mail, avec un lien pour annuler.", wlTitle: "Tu es sur la liste d'attente", wlBody: "Si une place se libère, nous t'inscrivons automatiquement et t'envoyons un e-mail.", paidOk: "Merci ! Ton paiement a réussi ; la confirmation est dans ta boîte mail.", paidCancel: "Le paiement a été interrompu. Ta place sera libérée après 30 minutes.", err_full: "Désolé, c'est complet.", err_duplicate: "Tu es déjà inscrit·e avec cette adresse.", err_closed: "Les inscriptions sont fermées.", err_past: "Cet événement est passé.", err_generic: "L'inscription a échoué. Réessaie ou écris-nous.", close: "Fermer", audience: "Pour" },
  en: { title: "Events", free: "Free", per: "per person", left: "places left", few: "Only {n} places left", full: "Full — waiting list", register: "Register", waitlist: "Join waiting list", noReg: "Open to all", ics: "Add to calendar", name: "Name", email: "E-mail", phone: "Phone (optional)", seats: "Number of people", note: "Note (optional)", total: "Total", confirm: "Confirm registration", pay: "Continue to payment", okTitle: "You're registered!", okBody: "We sent a confirmation to your e-mail, with a link to cancel.", wlTitle: "You're on the waiting list", wlBody: "If a place opens up, we'll register you automatically and e-mail you.", paidOk: "Thank you! Your payment went through; the confirmation is in your inbox.", paidCancel: "Payment was cancelled. Your place is released after 30 minutes.", err_full: "Sorry, it just filled up.", err_duplicate: "You're already registered with this e-mail.", err_closed: "Registration is closed.", err_past: "This event is over.", err_generic: "Registration failed. Please try again or e-mail us.", close: "Close", audience: "For" },
};

const eur = (c: number) => `€ ${(c / 100).toFixed(2).replace(".", ",").replace(",00", "")}`;

function icsHref(e: PublicEvent, title: string, desc: string): string {
  const dt = (d: string, t: string) => `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Maximilien//Agenda//NL", "BEGIN:VEVENT",
    `UID:${e.id}@maximilien.brussels`,
    `DTSTART;TZID=Europe/Brussels:${dt(e.date, e.startTime)}`,
    `DTEND;TZID=Europe/Brussels:${dt(e.date, e.endTime)}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`,
    "LOCATION:Ferme du Parc Maximilien\\, Quai du Batelage 2\\, 1000 Bruxelles",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

export function PublicEventList() {
  const { lang, tx } = useT();
  const k = (lang === "fr" || lang === "en" ? lang : "nl") as Lang;
  const c = C[k];
  const { data: events = [] } = useQuery(publicEventsQO);
  const [active, setActive] = useState<PublicEvent | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("inschrijving");
    if (p === "betaald") setBanner(c.paidOk);
    if (p === "geannuleerd") setBanner(c.paidCancel);
  }, [c.paidOk, c.paidCancel]);

  if (events.length === 0 && !banner) return null;
  const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(localeFor(lang), { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="mt-12" aria-labelledby="ev-title">
      <h2 id="ev-title" className="flex items-center gap-2 font-serif text-2xl text-[color:var(--ink-forest)]">
        <Ticket className="h-5 w-5" aria-hidden /> {c.title}
      </h2>
      {banner && <p role="status" className="mt-4 rounded-2xl bg-[color:var(--color-sage)]/15 p-4 text-sm">{banner}</p>}
      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {events.map((e) => {
          const title = tx(e.title[k] || e.title.nl);
          const desc = tx(e.description[k] || e.description.nl);
          const full = e.seatsLeft === 0;
          const day = new Date(`${e.date}T12:00:00`);
          return (
            <li key={e.id} className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card">
              {e.imageUrl && <img src={e.imageUrl} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />}
              <div className="flex flex-1 gap-4 p-5">
                <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[color:var(--surface-page)] text-[color:var(--ink-forest)]">
                  <span className="font-serif text-2xl leading-none">{day.getDate()}</span>
                  <span className="text-[10px] uppercase tracking-widest">{day.toLocaleDateString(localeFor(lang), { month: "short" })}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="font-serif text-xl leading-snug text-[color:var(--ink-forest)]">{title}</h3>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 first-letter:uppercase"><Clock className="h-3.5 w-3.5" />{fmt(e.date)} · {e.startTime}–{e.endTime}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{LOC[e.locationId]?.[k] ?? e.locationId}</span>
                    {e.audience && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.audience} {tx(e.audience)}</span>}
                  </p>
                  {desc && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{desc}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="font-serif text-lg text-[color:var(--ink-forest)]">
                      {e.priceCents ? <>{eur(e.priceCents)} <span className="text-xs text-muted-foreground">{c.per}</span></> : c.free}
                    </span>
                    {e.registrationOpen && e.seatsLeft != null && (
                      <span className={`text-xs font-medium ${full ? "text-muted-foreground" : e.seatsLeft <= 5 ? "text-[color:var(--color-terracotta)]" : "text-[color:var(--color-sage)]"}`}>
                        {full ? c.full : e.seatsLeft <= 5 ? c.few.replace("{n}", String(e.seatsLeft)) : `${e.seatsLeft} ${c.left}`}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {e.registrationOpen ? (
                      <button type="button" onClick={() => setActive(e)} className="inline-flex min-h-[44px] items-center rounded-full bg-[color:var(--surface-forest)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)]">
                        {full ? c.waitlist : c.register}
                      </button>
                    ) : (
                      <span className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground">{c.noReg}</span>
                    )}
                    <a href={icsHref(e, title, desc)} download={`${e.date}-maximilien.ics`} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium hover:bg-muted">
                      <CalendarPlus className="h-4 w-4" /> {c.ics}
                    </a>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <RegisterDialog event={active} lang={k} onClose={() => setActive(null)} />
    </section>
  );
}

function RegisterDialog({ event, lang, onClose }: { event: PublicEvent | null; lang: Lang; onClose: () => void }) {
  const { tx } = useT();
  const c = C[lang];
  const qc = useQueryClient();
  const register = useServerFn(registerForEvent);
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "confirmed" | "waitlist">(null);
  const [err, setErr] = useState<string | null>(null);
  const [hp, setHp] = useState("");

  useEffect(() => { setSeats(1); setDone(null); setErr(null); }, [event?.id]);
  if (!event) return null;
  const maxSeats = Math.max(1, Math.min(8, event.seatsLeft && event.seatsLeft > 0 ? event.seatsLeft : 8));
  const paid = event.priceCents > 0;

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!event || busy) return;
    const f = new FormData(ev.currentTarget);
    const payload = {
      eventId: event.id, name: String(f.get("name") ?? ""), email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""), note: String(f.get("note") ?? ""), seats, lang,
      allowWaitlist: true, website_hp: hp, returnPath: window.location.pathname,
    };
    setBusy(true); setErr(null);
    try {
      if (paid) {
        const r = await fetch("/api/events/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const j = (await r.json().catch(() => ({}))) as { url?: string; status?: string; error?: string };
        if (j.url) { window.location.assign(j.url); return; }
        if (j.status === "waitlist") setDone("waitlist");
        else setErr(c[`err_${j.error}`] ?? c.err_generic);
      } else {
        const res = await register({ data: payload });
        if (res.ok) setDone(res.status === "waitlist" ? "waitlist" : "confirmed");
        else setErr(c[`err_${res.reason}`] ?? c.err_generic);
      }
      void qc.invalidateQueries({ queryKey: publicEventsQO.queryKey });
    } catch {
      setErr(c.err_generic);
    } finally { setBusy(false); }
  }

  const input = "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[color:var(--color-terracotta)]";
  const lab = "text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";
  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[color:var(--ink-forest)]">{tx(event.title[lang] || event.title.nl)}</DialogTitle>
          <DialogDescription>{event.date} · {event.startTime}–{event.endTime}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[color:var(--color-sage)]" />
            <p className="mt-3 font-serif text-xl">{done === "waitlist" ? c.wlTitle : c.okTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{done === "waitlist" ? c.wlBody : c.okBody}</p>
            <button type="button" onClick={onClose} className="mt-5 inline-flex min-h-[44px] items-center rounded-full border border-border px-5 text-sm">{c.close}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <label><span className={lab}>{c.name}</span><input name="name" required minLength={2} maxLength={120} autoComplete="name" className={input} /></label>
            <label><span className={lab}>{c.email}</span><input name="email" type="email" required autoComplete="email" className={input} /></label>
            <label><span className={lab}>{c.phone}</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} className={input} /></label>
            <div>
              <span className={lab}>{c.seats}</span>
              <div className="mt-1.5 flex items-center gap-3">
                <button type="button" aria-label="-" onClick={() => setSeats(Math.max(1, seats - 1))} className="grid h-11 w-11 place-items-center rounded-full border border-border"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-serif text-2xl tabular-nums" aria-live="polite">{seats}</span>
                <button type="button" aria-label="+" onClick={() => setSeats(Math.min(maxSeats, seats + 1))} className="grid h-11 w-11 place-items-center rounded-full border border-border"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <label><span className={lab}>{c.note}</span><textarea name="note" rows={2} maxLength={500} className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-[color:var(--color-terracotta)]" /></label>
            <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            {paid && <p className="font-serif text-xl text-[color:var(--ink-forest)]">{c.total}: {eur(event.priceCents * seats)}</p>}
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <button type="submit" disabled={busy} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {paid ? c.pay : c.confirm}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
