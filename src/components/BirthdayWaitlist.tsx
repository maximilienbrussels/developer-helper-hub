import { useMemo, useState } from "react";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { nl, fr, enGB } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BIRTHDAY_PACKAGES } from "@/lib/birthday-packages";
import { WAITLIST_MAX_ALTERNATIVES, waitlistChildrenLimit } from "@/lib/birthday-waitlist";
import { useT } from "@/lib/i18n";

const COPY = {
  nl: {
    eyebrow: "Datum al volzet?",
    title: "Zet je op de wachtlijst",
    lede: "Geef je gewenste datum en een paar alternatieven door. Komt er een plek vrij, dan contacteren we je meteen.",
    note: "Kinderfeestjes vinden alleen plaats op woensdag of zaterdag; de kalender toont enkel die dagen.",
    pkg: "Formule",
    date: "Gewenste (volzette) datum",
    alts: (n: number) => `Alternatieve data (max. ${n})`,
    altsHint: "Tik op extra dagen in de kalender om ze toe te voegen.",
    first: "Voornaam",
    last: "Familienaam",
    phone: "Telefoon",
    email: "E-mail",
    children: "Aantal kinderen (ongeveer)",
    message: "Opmerking (optioneel)",
    submit: "Zet me op de wachtlijst",
    sending: "Bezig…",
    done: "Je staat op de wachtlijst. Je krijgt zo een bevestiging per e-mail.",
    again: "Nog een aanvraag",
    received: "Je aanvraag is bij het team aangekomen. De bevestigingsmail kon niet worden verstuurd. Je hoeft niet opnieuw aan te vragen.",
    remove: "Verwijder datum",
    errors: {
      children: "Het aantal kinderen overschrijdt de capaciteit van deze formule.",
      date: "Kies een geldige datum voor deze formule.",
      alternatives: "Een van de alternatieve data klopt niet.",
      rate_limited: "Te veel aanvragen. Probeer het over een uur opnieuw.",
      generic: "Versturen lukte niet. Bel ons op +32 2 331 53 91.",
    },
    pickDate: "Kies eerst je gewenste datum.",
  },
  fr: {
    eyebrow: "Date déjà complète ?",
    title: "Inscrivez-vous sur la liste d'attente",
    lede: "Indiquez la date souhaitée et quelques alternatives. Dès qu'un créneau se libère, nous vous prévenons.",
    note: "Les anniversaires ont lieu uniquement le mercredi ou le samedi ; le calendrier n'affiche que ces jours.",
    pkg: "Formule",
    date: "Date souhaitée (complète)",
    alts: (n: number) => `Dates alternatives (max. ${n})`,
    altsHint: "Touchez d'autres jours dans le calendrier pour les ajouter.",
    first: "Prénom",
    last: "Nom de famille",
    phone: "Téléphone",
    email: "E-mail",
    children: "Nombre d'enfants (environ)",
    message: "Remarque (facultatif)",
    submit: "M'inscrire sur la liste d'attente",
    sending: "Envoi…",
    done: "Vous êtes sur la liste d'attente. Une confirmation arrive par e-mail.",
    again: "Nouvelle demande",
    received: "Votre demande est parvenue à l’équipe. La confirmation n’a pas pu être envoyée. Il est inutile de refaire la demande.",
    remove: "Supprimer la date",
    errors: {
      children: "Le nombre d’enfants dépasse la capacité de cette formule.",
      date: "Choisissez une date valable pour cette formule.",
      alternatives: "Une des dates alternatives n'est pas valable.",
      rate_limited: "Trop de demandes. Réessayez dans une heure.",
      generic: "L'envoi a échoué. Appelez-nous au +32 2 331 53 91.",
    },
    pickDate: "Choisissez d'abord la date souhaitée.",
  },
  en: {
    eyebrow: "Date already taken?",
    title: "Join the waiting list",
    lede: "Give us your preferred date and a few alternatives. As soon as a slot frees up, we'll contact you.",
    note: "Birthday parties only take place on Wednesdays or Saturdays; the calendar only shows those days.",
    pkg: "Package",
    date: "Preferred (fully booked) date",
    alts: (n: number) => `Alternative dates (max. ${n})`,
    altsHint: "Tap extra days in the calendar to add them.",
    first: "First name",
    last: "Last name",
    phone: "Phone",
    email: "E-mail",
    children: "Number of children (approx.)",
    message: "Note (optional)",
    submit: "Put me on the waiting list",
    sending: "Sending…",
    done: "You're on the waiting list. A confirmation is on its way by e-mail.",
    again: "Another request",
    received: "The team has received your request. The confirmation email could not be sent. You do not need to submit again.",
    remove: "Remove date",
    errors: {
      children: "The number of children exceeds this package’s capacity.",
      date: "Choose a valid date for this package.",
      alternatives: "One of the alternative dates isn't valid.",
      rate_limited: "Too many requests. Try again in an hour.",
      generic: "Sending failed. Call us on +32 2 331 53 91.",
    },
    pickDate: "Choose your preferred date first.",
  },
} as const;

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function BirthdayWaitlist() {
  const { lang } = useT();
  const c = COPY[lang];
  const locale = lang === "nl" ? "nl-BE" : lang === "fr" ? "fr-BE" : "en-GB";
  const [pkgSlug, setPkgSlug] = useState(BIRTHDAY_PACKAGES[0]?.slug ?? "woensdag");
  const pkg = BIRTHDAY_PACKAGES.find((p) => p.slug === pkgSlug);
  const [date, setDate] = useState<Date | undefined>();
  const [alts, setAlts] = useState<Date[]>([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", children: "", note: "", hp: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const disabled = [{ before: today }, (d: Date) => d.getDay() !== pkg?.weekday];
  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  const pickPackage = (slug: string) => {
    setPkgSlug(slug);
    setDate(undefined);
    setAlts([]);
    setForm((f) => ({ ...f, children: "" }));
    setError(null);
  };

  const toggleAlt = (list: Date[] | undefined) => {
    const next = (list ?? []).filter((d) => !date || toIso(d) !== toIso(date));
    setAlts(next.slice(0, WAITLIST_MAX_ALTERNATIVES).sort((a, b) => a.getTime() - b.getTime()));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date) return setError(c.pickDate);
    setState("sending");
    try {
      const res = await fetch("/api/birthday/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          packageSlug: pkgSlug,
          date: toIso(date),
          alternatives: alts.map(toIso),
          children: form.children ? Number(form.children) : undefined,
          note: form.note || undefined,
          website_hp: form.hp,
          lang,
        }),
      });
      if (res.ok) {
        const result = await res.json() as { confirmationSent?: boolean };
        setConfirmationSent(result.confirmationSent === true);
        return setState("done");
      }
      const { error: code } = (await res.json().catch(() => ({}))) as { error?: string };
      setError(c.errors[(code as keyof typeof c.errors) ?? "generic"] ?? c.errors.generic);
    } catch {
      setError(c.errors.generic);
    }
    setState("idle");
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <section id="wachtlijst" className="mt-10 scroll-mt-24 border-t border-border py-8">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
        <CalendarClock className="h-4 w-4" aria-hidden /> {c.eyebrow}
      </p>
      <h3 className="mt-2 font-serif text-2xl text-[color:var(--ink-forest)]">{c.title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/90">{c.lede}</p>
      <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>

      {state === "done" ? (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-[color:var(--surface-page)]/70 p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-[color:var(--ink-forest)]">
            <Check className="h-4 w-4 text-[color:var(--color-terracotta)]" aria-hidden /> {confirmationSent ? c.done : c.received}
          </p>
          <Button
            type="button"
            onClick={() => {
              setState("idle");
              setDate(undefined);
              setAlts([]);
            }}
            variant="link" className="px-0"
          >
            {c.again}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <fieldset>
              <legend className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{c.pkg}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {BIRTHDAY_PACKAGES.map((p) => (
                  <Button
                    key={p.slug}
                    type="button"
                    variant={p.slug === pkgSlug ? "default" : "outline"}
                    aria-pressed={p.slug === pkgSlug}
                    onClick={() => pickPackage(p.slug)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                      p.slug === pkgSlug
                        ? "border-transparent"
                        : "border-border bg-background text-foreground/90 hover:border-[color:var(--color-terracotta)]"
                    }`}
                  >
                    <span className="block font-semibold">{p.copy[lang].title}</span>
                    <span className="opacity-80">{p.copy[lang].day}</span>
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{c.date}</p>
                <Calendar
                  locale={lang === "nl" ? nl : lang === "fr" ? fr : enGB}
                  weekStartsOn={1}
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d) setAlts((a) => a.filter((x) => toIso(x) !== toIso(d)));
                  }}
                  disabled={disabled}
                  className="mt-2 rounded-xl border border-border"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {c.alts(WAITLIST_MAX_ALTERNATIVES)}
                </p>
                <Calendar
                  locale={lang === "nl" ? nl : lang === "fr" ? fr : enGB}
                  weekStartsOn={1}
                  mode="multiple"
                  max={WAITLIST_MAX_ALTERNATIVES}
                  selected={alts}
                  onSelect={toggleAlt}
                  disabled={[...disabled, ...(date ? [date] : [])]}
                  className="mt-2 rounded-xl border border-border"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2" aria-live="polite">
              {date ? (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {fmt(date)}
                </span>
              ) : null}
              {alts.map((a) => (
                <span key={toIso(a)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                  {fmt(a)}
                  <Button
                    type="button"
                    variant="ghost" size="icon"
                    aria-label={`${c.remove}: ${fmt(a)}`}
                    onClick={() => setAlts((l) => l.filter((x) => toIso(x) !== toIso(a)))}
                    className="size-6 min-h-0 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
              {!alts.length ? <span className="text-xs text-muted-foreground">{c.altsHint}</span> : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                {c.first} *
                <Input required maxLength={80} autoComplete="given-name" className="mt-1" {...field("firstName")} />
              </label>
              <label className="text-sm">
                {c.last} *
                <Input required maxLength={80} autoComplete="family-name" className="mt-1" {...field("lastName")} />
              </label>
              <label className="text-sm">
                {c.phone} *
                <Input required type="tel" minLength={6} maxLength={40} autoComplete="tel" className="mt-1" {...field("phone")} />
              </label>
              <label className="text-sm">
                {c.email} *
                <Input required type="email" maxLength={160} autoComplete="email" className="mt-1" {...field("email")} />
              </label>
            </div>
            <label className="block text-sm">
              {c.children}
              <Input type="number" min={1} max={waitlistChildrenLimit(pkgSlug)} inputMode="numeric" className="mt-1 max-w-[10rem]" {...field("children")} />
            </label>
            <label className="block text-sm">
              {c.message}
              <Textarea rows={4} maxLength={1500} className="mt-1" {...field("note")} />
            </label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              {...field("hp")}
            />
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={state === "sending"}
              className="w-full min-h-12 px-5 py-3 text-sm font-semibold"
            >
              {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {state === "sending" ? c.sending : c.submit}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
