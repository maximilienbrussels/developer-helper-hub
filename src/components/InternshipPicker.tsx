import { useState } from "react";
import { Loader2, MapPin, Send, Upload } from "lucide-react";
import { useT, type Lang } from "@/lib/i18n";
import { CV_MAX_BYTES, INTERNSHIPS, INTERNSHIP_WEEKDAYS } from "@/lib/internships";

const L: Record<Lang, Record<string, string>> = {
  nl: { apply: "Solliciteer voor deze stage", formTitle: "Je kandidatuur", name: "Naam", email: "E-mail", phone: "Telefoon (optioneel)", studies: "Welke studies volg je?", school: "Welke school?", start: "Gewenste startdatum", duration: "Duur van de stage", durationPh: "bv. 6 weken, 120 uur", days: "Op welke dagen ben je er in een gewone week?", notes: "Iets dat we moeten weten? (optioneel)", cv: "Cv (verplicht, PDF of Word, max. 5 MB)", letter: "Motivatiebrief (optioneel, maar altijd gewaardeerd)", send: "Kandidatuur versturen", sent: "Bedankt! We hebben je kandidatuur goed ontvangen en nemen snel contact op.", failed: "Versturen lukte niet. Controleer je bestanden of mail ons op contact@maximilien.brussels.", tooBig: "Dit bestand is groter dan 5 MB.", ma: "ma", di: "di", wo: "wo", do: "do", vr: "vr" },
  fr: { apply: "Postuler pour ce stage", formTitle: "Ta candidature", name: "Nom", email: "E-mail", phone: "Téléphone (facultatif)", studies: "Dans le cadre de quelles études ?", school: "Dans quel établissement ?", start: "Date de début souhaitée", duration: "Durée du stage", durationPh: "ex. 6 semaines, 120 heures", days: "Quels jours seras-tu présent·e sur une semaine type ?", notes: "Une information à nous partager ? (facultatif)", cv: "CV (obligatoire, PDF ou Word, max. 5 Mo)", letter: "Lettre de motivation (facultative mais appréciée)", send: "Envoyer ma candidature", sent: "Merci ! Nous avons bien reçu ta candidature et revenons vers toi rapidement.", failed: "L'envoi a échoué. Vérifie tes fichiers ou écris-nous à contact@maximilien.brussels.", tooBig: "Ce fichier dépasse 5 Mo.", ma: "lun", di: "mar", wo: "mer", do: "jeu", vr: "ven" },
  en: { apply: "Apply for this internship", formTitle: "Your application", name: "Name", email: "E-mail", phone: "Phone (optional)", studies: "What are you studying?", school: "Which school?", start: "Preferred start date", duration: "Length of the internship", durationPh: "e.g. 6 weeks, 120 hours", days: "Which days would you be here in a typical week?", notes: "Anything we should know? (optional)", cv: "CV (required, PDF or Word, max. 5 MB)", letter: "Cover letter (optional, always appreciated)", send: "Send application", sent: "Thank you! We received your application and will get back to you soon.", failed: "Sending failed. Check your files or e-mail us at contact@maximilien.brussels.", tooBig: "This file is larger than 5 MB.", ma: "Mon", di: "Tue", wo: "Wed", do: "Thu", vr: "Fri" },
};

const field = "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[color:var(--color-terracotta)]";
const lab = "text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";

export function InternshipPicker() {
  const { lang, tx } = useT();
  const c = L[lang] ?? L.en;
  const k = (lang === "fr" || lang === "en" ? lang : lang === "nl" ? "nl" : "en") as "nl" | "fr" | "en";
  const [sel, setSel] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "sent" | "failed">("idle");
  const [fileErr, setFileErr] = useState<string | null>(null);
  const current = INTERNSHIPS.find((i) => i.id === sel);

  function checkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.size > CV_MAX_BYTES) {
      setFileErr(c.tooBig);
      e.target.value = "";
    } else setFileErr(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!current || state === "busy") return;
    setState("busy");
    const fd = new FormData(e.currentTarget);
    fd.set("internship", current.id);
    fd.set("days", days.join(","));
    fd.set("lang", k);
    try {
      const r = await fetch("/api/internship/apply", { method: "POST", body: fd });
      setState(r.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  return (
    <div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTERNSHIPS.map((i) => (
          <li key={i.id} className={`flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm ${sel === i.id ? "border-[color:var(--color-terracotta)]" : "border-border/60"}`}>
            <img src={i.photo} alt={tx(i.title[k])} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-serif text-lg text-[color:var(--ink-forest)]">{tx(i.title[k])}</h3>
              <p className="mt-1 text-sm font-medium text-foreground/90">{tx(i.tagline[k])}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{tx(i.body[k])}</p>
              {i.location && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--color-terracotta)]"><MapPin className="h-3.5 w-3.5" /> {i.location}</p>
              )}
              <button
                type="button"
                onClick={() => { setSel(i.id); setState("idle"); setTimeout(() => document.getElementById("stage-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[color:var(--surface-forest)] px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)]"
              >
                {c.apply}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {current && (
        <form id="stage-form" onSubmit={submit} className="mt-8 scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h3 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.formTitle} — {tx(current.title[k])}</h3>
          {state === "sent" ? (
            <p className="mt-4 rounded-2xl bg-[color:var(--color-sage)]/15 p-4 text-sm">{c.sent}</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label><span className={lab}>{c.name}</span><input name="name" required minLength={2} className={field} /></label>
              <label><span className={lab}>{c.email}</span><input name="email" type="email" required className={field} /></label>
              <label><span className={lab}>{c.phone}</span><input name="phone" type="tel" className={field} /></label>
              <label><span className={lab}>{c.studies}</span><input name="studies" required className={field} /></label>
              <label><span className={lab}>{c.school}</span><input name="school" required className={field} /></label>
              <label><span className={lab}>{c.start}</span><input name="start" type="date" required className={field} /></label>
              <label><span className={lab}>{c.duration}</span><input name="duration" required placeholder={c.durationPh} className={field} /></label>
              <fieldset>
                <legend className={lab}>{c.days}</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {INTERNSHIP_WEEKDAYS.map((d) => {
                    const on = days.includes(d);
                    return (
                      <button key={d} type="button" aria-pressed={on} onClick={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                        className={`h-11 min-w-[52px] rounded-xl border px-3 text-sm ${on ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 font-semibold" : "border-border"}`}>
                        {c[d]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="sm:col-span-2"><span className={lab}>{c.notes}</span><textarea name="notes" rows={3} maxLength={3000} className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-[color:var(--color-terracotta)]" /></label>
              <label><span className={lab}><Upload className="mr-1 inline h-3.5 w-3.5" />{c.cv}</span><input name="cv" type="file" required accept=".pdf,.doc,.docx" onChange={checkFile} className="mt-1.5 block w-full text-sm" /></label>
              <label><span className={lab}><Upload className="mr-1 inline h-3.5 w-3.5" />{c.letter}</span><input name="letter" type="file" accept=".pdf,.doc,.docx" onChange={checkFile} className="mt-1.5 block w-full text-sm" /></label>
              {current.requirement && (
                <label className="flex gap-3 rounded-2xl border border-border p-4 text-sm sm:col-span-2">
                  <input type="checkbox" name="requirementOk" value="yes" required className="mt-0.5 h-5 w-5" />
                  <span>{tx(current.requirement[k])}</span>
                </label>
              )}
              <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <button type="submit" disabled={state === "busy"} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)] disabled:opacity-60">
                  {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {c.send}
                </button>
                {fileErr && <span className="text-sm text-destructive">{fileErr}</span>}
                {state === "failed" && <span className="text-sm text-destructive">{c.failed}</span>}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
