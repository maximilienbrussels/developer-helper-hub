import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Printer, ShoppingBag, Truck, Store, RotateCcw } from "lucide-react";
import { useT, type Lang } from "@/lib/i18n";
import { OLD_ASSETS } from "@/lib/old-site-assets";
import {
  CARD_TEXT, DELIVERY_CENTS, INVITATION_LIMITS as M, PRINT_PACKS, PRINT_PRICE_PER_CARD_CENTS,
  formatCardDate, invitationTotalCents, type InvitationFields, type InvitationLang,
} from "@/lib/invitation";

const UI: Record<Lang, Record<string, string>> = {
  nl: {
    kicker: "Uitnodigingskaart", title: "Maak je uitnodiging hier online", lede: "Vul de gegevens in, bekijk meteen het resultaat en kies daarna: zelf afdrukken, opslaan als PDF of gedrukte kaarten bestellen.",
    cardLang: "Taal van de kaart", guest: "Naam van het vriendje", guestHint: "Leeg laten om met de hand in te vullen", child: "Naam van de jarige", age: "Leeftijd", date: "Datum van het feest", from: "Van", to: "Tot", rsvpName: "Antwoorden aan", rsvpPhone: "Telefoon", rsvpBy: "Antwoord vóór (optioneel)", note: "Extra regel (optioneel)", notePh: "bv. Laarzen aan, we gaan naar de dieren!",
    front: "Voorkant", back: "Achterkant", print: "Afdrukken", save: "Opslaan als PDF", busy: "Even geduld…", sheet: "PDF met 3 kaarten per A4: pagina 1 voorkant, pagina 2 achterkant (dubbelzijdig afdrukken, omslaan langs de lange kant).",
    orderTitle: "Gedrukte kaarten bestellen", orderLede: "Wij drukken je kaarten op stevig papier. Ophalen op de boerderij of per post in België.", qty: "Aantal kaarten", pickup: "Ophalen op de boerderij", post: "Per post", email: "Je e-mailadres", order: "Bestellen en betalen", total: "Totaal", perCard: "per kaart", needChild: "Vul eerst de naam van de jarige en de datum in.", failed: "Bestellen lukte niet. Probeer later opnieuw of mail ons.", ordered: "Bedankt! Je bestelling is betaald. We laten je weten wanneer de kaarten klaar zijn.", reset: "Opnieuw beginnen", original: "Liever het originele blanco ontwerp? Download het hier",
  },
  fr: {
    kicker: "Carton d'invitation", title: "Crée ton invitation en ligne", lede: "Complète les informations, vois le résultat tout de suite, puis choisis : imprimer toi-même, enregistrer en PDF ou commander des cartons imprimés.",
    cardLang: "Langue du carton", guest: "Prénom de l'invité·e", guestHint: "Laisser vide pour l'écrire à la main", child: "Prénom de l'enfant", age: "Âge", date: "Date de la fête", from: "De", to: "À", rsvpName: "Réponse à", rsvpPhone: "Téléphone", rsvpBy: "Réponse avant le (facultatif)", note: "Ligne en plus (facultatif)", notePh: "ex. Viens en bottes, on va voir les animaux !",
    front: "Recto", back: "Verso", print: "Imprimer", save: "Enregistrer en PDF", busy: "Un instant…", sheet: "PDF avec 3 cartons par A4 : page 1 recto, page 2 verso (impression recto-verso, bord long).",
    orderTitle: "Commander des cartons imprimés", orderLede: "Nous imprimons tes cartons sur papier épais. À retirer à la ferme ou par la poste en Belgique.", qty: "Nombre de cartons", pickup: "Retrait à la ferme", post: "Par la poste", email: "Ton adresse e-mail", order: "Commander et payer", total: "Total", perCard: "par carton", needChild: "Indique d'abord le prénom de l'enfant et la date.", failed: "La commande a échoué. Réessaie plus tard ou écris-nous.", ordered: "Merci ! Ta commande est payée. Nous te prévenons quand les cartons sont prêts.", reset: "Recommencer", original: "Tu préfères le modèle vierge original ? Télécharge-le ici",
  },
  en: {
    kicker: "Invitation card", title: "Make your invitation online", lede: "Fill in the details, see the result right away, then choose: print it yourself, save as PDF or order printed cards.",
    cardLang: "Card language", guest: "Friend's name", guestHint: "Leave empty to write by hand", child: "Birthday child's name", age: "Age", date: "Party date", from: "From", to: "To", rsvpName: "Reply to", rsvpPhone: "Phone", rsvpBy: "Reply by (optional)", note: "Extra line (optional)", notePh: "e.g. Wear boots, we're visiting the animals!",
    front: "Front", back: "Back", print: "Print", save: "Save as PDF", busy: "One moment…", sheet: "PDF with 3 cards per A4: page 1 front, page 2 back (print double-sided, flip on long edge).",
    orderTitle: "Order printed cards", orderLede: "We print your cards on sturdy paper. Collect at the farm or get them by post in Belgium.", qty: "Number of cards", pickup: "Collect at the farm", post: "By post", email: "Your e-mail", order: "Order and pay", total: "Total", perCard: "per card", needChild: "First fill in the child's name and the date.", failed: "Ordering failed. Please try again later or e-mail us.", ordered: "Thank you! Your order is paid. We'll let you know when the cards are ready.", reset: "Start over", original: "Prefer the original blank design? Download it here",
  },
};

const STORE = "maximilien.invitation.v1";
const EMPTY = (l: InvitationLang): InvitationFields => ({ cardLang: l, guest: "", child: "", age: "", date: "", from: "14:00", to: "17:00", rsvpName: "", rsvpPhone: "", rsvpBy: "", note: "" });
const HAND = "'Delius', 'Comic Neue', 'Work Sans', sans-serif";
const eur = (c: number) => `€ ${(c / 100).toFixed(2).replace(".", ",")}`;

/** Eén kaart op ware verhouding (21 × 9,9 cm). Alle maten in cqw zodat de kaart overal gelijk schaalt. */
function CardFront({ f }: { f: InvitationFields }) {
  const t = CARD_TEXT[f.cardLang];
  return (
    <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: "2067 / 974", containerType: "inline-size", fontFamily: HAND, color: "#1d1d1b" }}>
      <img src={OLD_ASSETS.uitnodigingVoorkant} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full" />
      <div className="absolute" style={{ left: "61%", top: "27%", width: "30%" }}>
        <p style={{ fontSize: "5.2cqw", lineHeight: 1, letterSpacing: "0.08em" }}>{t.title}</p>
        <p style={{ fontSize: "3.1cqw", lineHeight: 1.1, letterSpacing: "0.12em" }}>{t.subtitle}</p>
        <p style={{ fontSize: "1.75cqw", lineHeight: 1.45, marginTop: "1.6cqw", letterSpacing: "0.04em" }}>
          {t.hey} <span style={{ borderBottom: f.guest ? "none" : "0.12cqw dotted #1d1d1b", display: "inline-block", minWidth: "14cqw", fontWeight: 600 }}>{f.guest}</span>,{" "}
          {t.body(f.age)}
        </p>
        <p style={{ fontSize: "2.1cqw", textAlign: "right", marginTop: "1.6cqw", fontWeight: 600 }}>
          {f.child || <span style={{ borderBottom: "0.12cqw dotted #1d1d1b", display: "inline-block", minWidth: "13cqw" }}>&nbsp;</span>}
        </p>
      </div>
    </div>
  );
}

function CardBack({ f }: { f: InvitationFields }) {
  const t = CARD_TEXT[f.cardLang];
  const date = formatCardDate(f.date, f.cardLang);
  const by = formatCardDate(f.rsvpBy, f.cardLang);
  const line = { borderBottom: "0.12cqw dotted #1d1d1b", display: "inline-block", minWidth: "22cqw" } as const;
  return (
    <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: "2067 / 974", containerType: "inline-size", fontFamily: HAND, color: "#1d1d1b" }}>
      <img src={OLD_ASSETS.uitnodigingAchterkant} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full" />
      <div className="absolute" style={{ left: "7%", top: "31%", width: "55%", fontSize: "1.85cqw", lineHeight: 1.5 }}>
        <p><b>{t.when}</b> {date ? <span style={{ fontWeight: 600 }}>{date}</span> : <span style={line}>&nbsp;</span>}</p>
        <p>{t.time(f.from, f.to)}</p>
        <p style={{ marginTop: "1cqw" }}><b>{t.where}</b> {t.address}</p>
        <p style={{ marginTop: "1cqw" }}>
          <b>{t.rsvp}</b> {by && t.rsvpBy(by)}
          <br />
          {f.rsvpName || f.rsvpPhone ? <span style={{ fontWeight: 600 }}>{[f.rsvpName, f.rsvpPhone].filter(Boolean).join(" · ")}</span> : <span style={line}>&nbsp;</span>}
        </p>
        {f.note && <p style={{ marginTop: "1cqw", fontStyle: "italic" }}>{f.note}</p>}
      </div>
    </div>
  );
}

export function InvitationEditor() {
  const { lang, tx } = useT();
  const u = UI[lang] ?? UI.en;
  const initLang: InvitationLang = lang === "nl" || lang === "fr" ? lang : "en";
  const [f, setF] = useState<InvitationFields>(EMPTY(initLang));
  const [busy, setBusy] = useState<null | "pdf" | "print" | "order">(null);
  const [qty, setQty] = useState<number>(12);
  const [delivery, setDelivery] = useState<"pickup" | "post">("pickup");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ordered, setOrdered] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) setF({ ...EMPTY(initLang), ...JSON.parse(saved) });
    } catch { /* geen opslag */ }
    if (new URLSearchParams(window.location.search).get("uitnodiging") === "besteld") setOrdered(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(f)); } catch { /* geen opslag */ }
  }, [f]);

  const set = <K extends keyof InvitationFields>(k: K, v: InvitationFields[K]) => setF((p) => ({ ...p, [k]: v }));

  async function buildPdf() {
    const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    await document.fonts?.ready;
    const opts = { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" };
    const front = await toPng(frontRef.current!, opts);
    const back = await toPng(backRef.current!, opts);
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const w = 210, h = 99;
    for (const [n, img] of [[0, front], [1, back]] as const) {
      if (n) pdf.addPage();
      for (let i = 0; i < 3; i++) pdf.addImage(img, "PNG", 0, i * h, w, h, undefined, "FAST");
      // Snijlijnen tussen de kaarten.
      pdf.setDrawColor(200); pdf.setLineDashPattern([1, 1.5], 0);
      pdf.line(0, h, w, h); pdf.line(0, 2 * h, w, 2 * h);
    }
    return pdf;
  }
  const fileName = () => `uitnodiging-${(f.child || "feest").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;

  async function save() {
    setBusy("pdf");
    try { (await buildPdf()).save(fileName()); } finally { setBusy(null); }
  }
  async function print() {
    setBusy("print");
    try {
      const pdf = await buildPdf();
      pdf.autoPrint();
      const url = URL.createObjectURL(pdf.output("blob"));
      const win = window.open(url, "_blank");
      if (!win) pdf.save(fileName());
    } finally { setBusy(null); }
  }
  async function order(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!f.child.trim() || !f.date) { setErr(u.needChild); return; }
    setBusy("order");
    try {
      const r = await fetch("/api/invitation/order-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty, delivery, email, lang: initLang, card: f }),
      });
      const j = (await r.json().catch(() => ({}))) as { url?: string };
      if (r.ok && j.url) window.location.assign(j.url);
      else setErr(u.failed);
    } catch { setErr(u.failed); } finally { setBusy(null); }
  }

  const input = "mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[color:var(--color-terracotta)]";
  const lab = "text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";
  const total = invitationTotalCents(qty, delivery) ?? 0;

  return (
    <section id="uitnodiging" className="mt-10 scroll-mt-24 rounded-3xl border border-[color:var(--color-terracotta)]/40 bg-card p-5 md:p-8">
      <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">{u.kicker}</p>
      <h3 className="font-serif mt-1 text-2xl text-[color:var(--ink-forest)] md:text-3xl">{u.title}</h3>
      <p className="mt-2 max-w-2xl text-sm text-foreground/90">{u.lede}</p>
      {ordered && <p className="mt-4 rounded-2xl bg-[color:var(--color-sage)]/15 p-4 text-sm">{u.ordered}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className={lab}>{u.cardLang}</legend>
            <div className="mt-1.5 flex gap-2">
              {(["nl", "fr", "en"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={f.cardLang === l} onClick={() => set("cardLang", l)}
                  className={`h-11 min-w-[56px] rounded-xl border px-3 text-sm uppercase ${f.cardLang === l ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 font-semibold" : "border-border"}`}>{l}</button>
              ))}
            </div>
          </fieldset>
          <label><span className={lab}>{u.child}</span><input value={f.child} maxLength={M.child} onChange={(e) => set("child", e.target.value)} className={input} /></label>
          <label><span className={lab}>{u.age}</span><input value={f.age} inputMode="numeric" maxLength={M.age} onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))} className={input} /></label>
          <label className="sm:col-span-2"><span className={lab}>{u.guest}</span><input value={f.guest} maxLength={M.guest} placeholder={u.guestHint} onChange={(e) => set("guest", e.target.value)} className={input} /></label>
          <label className="sm:col-span-2"><span className={lab}>{u.date}</span><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className={input} /></label>
          <label><span className={lab}>{u.from}</span><input type="time" value={f.from} onChange={(e) => set("from", e.target.value)} className={input} /></label>
          <label><span className={lab}>{u.to}</span><input type="time" value={f.to} onChange={(e) => set("to", e.target.value)} className={input} /></label>
          <label><span className={lab}>{u.rsvpName}</span><input value={f.rsvpName} maxLength={M.rsvpName} onChange={(e) => set("rsvpName", e.target.value)} className={input} /></label>
          <label><span className={lab}>{u.rsvpPhone}</span><input type="tel" value={f.rsvpPhone} maxLength={M.rsvpPhone} onChange={(e) => set("rsvpPhone", e.target.value)} className={input} /></label>
          <label className="sm:col-span-2"><span className={lab}>{u.rsvpBy}</span><input type="date" value={f.rsvpBy} onChange={(e) => set("rsvpBy", e.target.value)} className={input} /></label>
          <label className="sm:col-span-2"><span className={lab}>{u.note}</span><input value={f.note} maxLength={M.note} placeholder={u.notePh} onChange={(e) => set("note", e.target.value)} className={input} /></label>
          <button type="button" onClick={() => setF(EMPTY(f.cardLang))} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline sm:col-span-2">
            <RotateCcw className="h-3.5 w-3.5" /> {u.reset}
          </button>
        </div>

        <div className="min-w-0">
          <p className={lab}>{u.front}</p>
          <div ref={frontRef} className="mt-1.5 overflow-hidden rounded-lg shadow-md ring-1 ring-border"><CardFront f={f} /></div>
          <p className={`${lab} mt-4`}>{u.back}</p>
          <div ref={backRef} className="mt-1.5 overflow-hidden rounded-lg shadow-md ring-1 ring-border"><CardBack f={f} /></div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={print} disabled={!!busy} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--ink-forest)] px-5 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--surface-page)] hover:opacity-90 disabled:opacity-60">
              {busy === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} {busy === "print" ? u.busy : u.print}
            </button>
            <button type="button" onClick={save} disabled={!!busy} className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[color:var(--ink-forest)] px-5 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--ink-forest)] hover:bg-[color:var(--ink-forest)]/5 disabled:opacity-60">
              {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {busy === "pdf" ? u.busy : u.save}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{u.sheet}</p>
          <a href={OLD_ASSETS.uitnodigingMaFeteChampetre} download="ma-fete-champetre-blanco.pdf" className="mt-1 inline-block text-xs text-[color:var(--color-terracotta)] underline-offset-2 hover:underline">{u.original}</a>

          <form onSubmit={order} className="mt-6 rounded-2xl border border-border bg-background/60 p-5">
            <h4 className="font-serif text-xl text-[color:var(--ink-forest)]">{u.orderTitle}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{u.orderLede}</p>
            <p className={`${lab} mt-4`}>{u.qty} · {eur(PRINT_PRICE_PER_CARD_CENTS)} {u.perCard}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PRINT_PACKS.map((n) => (
                <button key={n} type="button" aria-pressed={qty === n} onClick={() => setQty(n)}
                  className={`h-11 min-w-[56px] rounded-xl border px-3 text-sm ${qty === n ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 font-semibold" : "border-border"}`}>{n}</button>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {([["pickup", Store, u.pickup, 0], ["post", Truck, u.post, DELIVERY_CENTS]] as const).map(([k, Icon, label, cost]) => (
                <button key={k} type="button" aria-pressed={delivery === k} onClick={() => setDelivery(k)}
                  className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-4 text-sm ${delivery === k ? "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)]/10 font-semibold" : "border-border"}`}>
                  <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
                  <span className="text-muted-foreground">{cost ? `+ ${eur(cost)}` : "€ 0"}</span>
                </button>
              ))}
            </div>
            <label className="mt-4 block"><span className={lab}>{u.email}</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-serif text-2xl text-[color:var(--ink-forest)]">{u.total}: {eur(total)}</p>
              <button type="submit" disabled={!!busy} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)] disabled:opacity-60">
                {busy === "order" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />} {u.order}
              </button>
            </div>
            {err && <p className="mt-2 text-sm text-destructive">{tx(err)}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
