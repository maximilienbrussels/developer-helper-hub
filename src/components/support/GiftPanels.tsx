import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, CreditCard, Landmark, Loader2, Receipt, Repeat } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { deepTx } from "@/lib/i18n-extra";
import {
  ARC_EN_CIEL,
  DONATION_MAX_EUR,
  DONATION_MIN_EUR,
  DONATION_PRESETS,
  donationImpact,
  type DonationFrequency,
} from "@/lib/donation";

type Copy3 = {
  onlineTitle: string;
  onlineBody: string;
  once: string;
  monthly: string;
  perMonth: string;
  other: string;
  name: string;
  email: string;
  give: string;
  giveMonthly: string;
  noTax: string;
  range: string;
  unavailable: string;
  failed: string;
  success: string;
  cancelled: string;
  transferTitle: string;
  transferBody: string;
  beneficiary: string;
  iban: string;
  bic: string;
  communication: string;
  communicationWarn: string;
  taxTitle: string;
  taxBody: string;
  qrTitle: string;
  qrBody: string;
  qrAmount: string;
  copy: string;
  copied: string;
  standingOrder: string;
};

const COPY: Record<"nl" | "fr" | "en", Copy3> = {
  nl: {
    onlineTitle: "Online geven",
    onlineBody: "Met kaart, Bancontact of Apple/Google Pay. Eenmalig, of maandelijks zodat we op lange termijn kunnen plannen. Een maandgift stop je zelf wanneer je wil.",
    once: "Eenmalig",
    monthly: "Maandelijks",
    perMonth: "/ maand",
    other: "Ander bedrag",
    name: "Naam (optioneel)",
    email: "E-mailadres voor je betaalbewijs",
    give: "Geef {amount}",
    giveMonthly: "Geef {amount} per maand",
    noTax: "Online giften geven geen fiscaal attest. Wil je belastingvoordeel? Kies dan de overschrijving via Arc-en-Ciel hiernaast.",
    range: "Kies een bedrag tussen {min} € en {max} €.",
    unavailable: "Online geven is even niet beschikbaar. De overschrijving werkt altijd.",
    failed: "Er ging iets mis. Probeer opnieuw of gebruik de overschrijving.",
    success: "Hartelijk dank voor je gift! Je betaalbewijs zit in je mailbox.",
    cancelled: "Je gift is niet afgerond. Je kan het gerust opnieuw proberen.",
    transferTitle: "Overschrijving met fiscaal attest",
    transferBody: "Ons project is erkend door de Service Arc-en-Ciel. Zij ontvangen je gift en storten hem volledig door aan de boerderij.",
    beneficiary: "Begunstigde",
    iban: "IBAN",
    bic: "BIC",
    communication: "Mededeling",
    communicationWarn: "Vergeet de mededeling niet, anders komt je gift niet bij ons terecht.",
    taxTitle: "Fiscaal aftrekbaar",
    taxBody: "Vanaf {min} € per kalenderjaar stuurt Arc-en-Ciel je een fiscaal attest. Je krijgt 45 % van je gift terug via je belastingaangifte.",
    qrTitle: "Scan met je bank-app",
    qrBody: "Alle gegevens, ook de mededeling, worden automatisch ingevuld.",
    qrAmount: "Bedrag in de QR-code",
    copy: "Kopieer",
    copied: "Gekopieerd",
    standingOrder: "Tip: maak in je bank-app een doorlopende opdracht met deze gegevens voor een maandelijkse gift mét fiscaal attest.",
  },
  fr: {
    onlineTitle: "Donner en ligne",
    onlineBody: "Par carte, Bancontact ou Apple/Google Pay. Une fois, ou chaque mois pour nous permettre de planifier à long terme. Vous arrêtez un don mensuel quand vous le souhaitez.",
    once: "Une fois",
    monthly: "Chaque mois",
    perMonth: "/ mois",
    other: "Autre montant",
    name: "Nom (facultatif)",
    email: "Adresse e-mail pour votre reçu",
    give: "Donner {amount}",
    giveMonthly: "Donner {amount} par mois",
    noTax: "Les dons en ligne ne donnent pas d'attestation fiscale. Pour l'avantage fiscal, choisissez le virement via Arc-en-Ciel.",
    range: "Choisissez un montant entre {min} € et {max} €.",
    unavailable: "Le don en ligne est momentanément indisponible. Le virement fonctionne toujours.",
    failed: "Un problème est survenu. Réessayez ou utilisez le virement.",
    success: "Merci de tout cœur pour votre don ! Votre reçu est dans votre boîte mail.",
    cancelled: "Votre don n'a pas été finalisé. Vous pouvez réessayer.",
    transferTitle: "Virement avec attestation fiscale",
    transferBody: "Notre projet est agréé par le Service Arc-en-Ciel. Il reçoit votre don et le reverse intégralement à la ferme.",
    beneficiary: "Bénéficiaire",
    iban: "IBAN",
    bic: "BIC",
    communication: "Communication",
    communicationWarn: "N'oubliez pas la communication, sinon votre don ne nous parvient pas.",
    taxTitle: "Déductible fiscalement",
    taxBody: "À partir de {min} € par année civile, Arc-en-Ciel vous envoie une attestation fiscale. Vous récupérez 45 % de votre don via votre déclaration.",
    qrTitle: "Scannez avec votre app bancaire",
    qrBody: "Toutes les données, communication comprise, sont remplies automatiquement.",
    qrAmount: "Montant dans le QR code",
    copy: "Copier",
    copied: "Copié",
    standingOrder: "Astuce : créez un ordre permanent avec ces données dans votre app bancaire pour un don mensuel avec attestation fiscale.",
  },
  en: {
    onlineTitle: "Give online",
    onlineBody: "By card, Bancontact or Apple/Google Pay. Once, or monthly so we can plan ahead. You can stop a monthly gift whenever you like.",
    once: "One-off",
    monthly: "Monthly",
    perMonth: "/ month",
    other: "Other amount",
    name: "Name (optional)",
    email: "E-mail address for your receipt",
    give: "Give {amount}",
    giveMonthly: "Give {amount} a month",
    noTax: "Online gifts do not come with a tax certificate. For the tax benefit, choose the Arc-en-Ciel bank transfer.",
    range: "Choose an amount between €{min} and €{max}.",
    unavailable: "Online giving is briefly unavailable. The bank transfer always works.",
    failed: "Something went wrong. Try again or use the bank transfer.",
    success: "Thank you so much for your gift! Your receipt is in your inbox.",
    cancelled: "Your gift was not completed. Feel free to try again.",
    transferTitle: "Bank transfer with tax certificate",
    transferBody: "Our project is approved by the Service Arc-en-Ciel. They receive your gift and pass it on in full to the farm.",
    beneficiary: "Beneficiary",
    iban: "IBAN",
    bic: "BIC",
    communication: "Reference",
    communicationWarn: "Don't forget the reference, otherwise your gift won't reach us.",
    taxTitle: "Tax-deductible",
    taxBody: "From €{min} per calendar year, Arc-en-Ciel sends you a tax certificate. You get 45% of your gift back through your tax return.",
    qrTitle: "Scan with your banking app",
    qrBody: "All details, including the reference, are filled in automatically.",
    qrAmount: "Amount in the QR code",
    copy: "Copy",
    copied: "Copied",
    standingOrder: "Tip: set up a standing order with these details in your banking app for a monthly gift with a tax certificate.",
  },
};

function fill(s: string, v: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
}

function base(lang: Lang): "nl" | "fr" | "en" {
  return lang === "fr" || lang === "en" ? lang : lang === "nl" ? "nl" : "en";
}

/** EPC/SEPA-QR ("girocode"): Belgische bank-apps vullen alles automatisch in. */
function epcPayload(amountEur: number | null): string {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    ARC_EN_CIEL.bic,
    ARC_EN_CIEL.beneficiary,
    ARC_EN_CIEL.iban.replace(/\s/g, ""),
    amountEur ? `EUR${amountEur.toFixed(2)}` : "",
    "",
    "",
    ARC_EN_CIEL.communication,
  ].join("\n");
}

const btn =
  "min-h-[48px] rounded-full border px-5 text-sm font-semibold transition-colors";
const on = "border-[color:var(--color-terracotta)] bg-[color:var(--color-terracotta)] text-[color:var(--color-cream)]";
const off = "border-border bg-background hover:border-[color:var(--color-terracotta)]";

export function GiftPanels() {
  const { lang, tx } = useT();
  const L = base(lang);
  const c = deepTx(tx, COPY[L]);
  const [freq, setFreq] = useState<DonationFrequency>("once");
  const [preset, setPreset] = useState<number>(DONATION_PRESETS.once[1]);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "cancelled" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrAmount, setQrAmount] = useState<number | null>(50);

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("gift");
    if (g === "success" || g === "cancelled") setStatus(g);
  }, []);

  const amount = useMemo(() => {
    if (custom.trim()) {
      const n = parseFloat(custom.replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    }
    return preset;
  }, [custom, preset]);
  const valid = amount >= DONATION_MIN_EUR && amount <= DONATION_MAX_EUR;
  const amountLabel = L === "en" ? `€${amount}` : `${amount} €`;

  function switchFreq(f: DonationFrequency) {
    setFreq(f);
    setPreset(DONATION_PRESETS[f][1]);
    setCustom("");
  }

  async function give(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/donation/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountEur: amount,
          frequency: freq,
          name: name.trim() || undefined,
          email: email.trim(),
          lang: L,
          returnPath: window.location.pathname,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error === "stripe_not_configured" ? c.unavailable : c.failed);
    } catch {
      setError(c.failed);
    } finally {
      setBusy(false);
    }
  }

  const copyVal = (val: string, key: string) =>
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });

  const field =
    "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]";
  const label = "text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground";

  return (
    <div className="mt-14 space-y-6">
      {status && (
        <div
          role="status"
          className="rounded-2xl border border-[color:var(--color-sage)] bg-[color:var(--color-sage)]/15 p-5 text-sm text-[color:var(--ink-forest)]"
        >
          {status === "success" ? c.success : c.cancelled}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Online */}
        <form
          onSubmit={give}
          className="min-w-0 rounded-3xl border border-[color:var(--color-sage)]/40 bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-sage)]/25 text-[color:var(--ink-forest)]">
              <CreditCard className="h-5 w-5" />
            </span>
            <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">{c.onlineTitle}</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">{c.onlineBody}</p>

          <div role="radiogroup" className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-border bg-[color:var(--surface-page)] p-1">
            {(["once", "monthly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={freq === f}
                onClick={() => switchFreq(f)}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${
                  freq === f ? "bg-[color:var(--surface-forest)] text-[color:var(--color-cream)]" : "text-foreground/80"
                }`}
              >
                {f === "monthly" && <Repeat className="h-4 w-4" />}
                {f === "once" ? c.once : c.monthly}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {DONATION_PRESETS[freq].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setPreset(a);
                  setCustom("");
                }}
                className={`${btn} ${!custom.trim() && preset === a ? on : off}`}
              >
                {L === "en" ? `€${a}` : `${a} €`}
                {freq === "monthly" && <span className="ml-1 text-xs font-normal opacity-80">{c.perMonth}</span>}
              </button>
            ))}
            <input
              inputMode="decimal"
              aria-label={c.other}
              placeholder={c.other}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-12 w-36 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-[color:var(--color-terracotta)]"
            />
          </div>
          <p className="mt-3 min-h-[1.25rem] text-sm text-[color:var(--ink-forest)]">
            {valid ? donationImpact(amount, freq, L) : fill(c.range, { min: DONATION_MIN_EUR, max: DONATION_MAX_EUR })}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className={label}>{c.name}</span>
              <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className={field} />
            </label>
            <label className="block min-w-0">
              <span className={label}>{c.email}</span>
              <input
                type="email"
                required
                maxLength={160}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!valid || busy}
            className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-sm font-semibold text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {fill(freq === "monthly" ? c.giveMonthly : c.give, { amount: amountLabel })}
          </button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{c.noTax}</p>
        </form>

        {/* Overschrijving via Arc-en-Ciel */}
        <div className="min-w-0 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-terracotta)]/15 text-[color:var(--color-terracotta)]">
              <Landmark className="h-5 w-5" />
            </span>
            <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">{c.transferTitle}</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">{c.transferBody}</p>

          <dl className="mt-6 space-y-3 text-sm">
            {[
              { k: "ben", l: c.beneficiary, v: ARC_EN_CIEL.beneficiary, sub: ARC_EN_CIEL.address, copy: ARC_EN_CIEL.beneficiary },
              { k: "iban", l: c.iban, v: ARC_EN_CIEL.iban, copy: ARC_EN_CIEL.iban.replace(/\s/g, "") },
              { k: "bic", l: c.bic, v: ARC_EN_CIEL.bic, copy: ARC_EN_CIEL.bic },
              { k: "com", l: c.communication, v: `« ${ARC_EN_CIEL.communication} »`, copy: ARC_EN_CIEL.communication, strong: true },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="min-w-0">
                  <dt className={label}>{r.l}</dt>
                  <dd className={`mt-1 break-all ${r.strong ? "font-semibold text-[color:var(--color-terracotta)]" : "font-medium"}`}>
                    {r.v}
                  </dd>
                  {r.sub && <dd className="text-xs text-muted-foreground">{r.sub}</dd>}
                </div>
                <button
                  type="button"
                  onClick={() => copyVal(r.copy, r.k)}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs hover:border-[color:var(--color-terracotta)]"
                >
                  {copied === r.k ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === r.k ? c.copied : c.copy}
                </button>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">{c.communicationWarn}</p>

          <div className="mt-6 grid gap-5 rounded-2xl border border-border/70 bg-[color:var(--surface-page)] p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="mx-auto rounded-xl bg-[color:var(--color-cream)] p-3">
              <QRCodeSVG value={epcPayload(qrAmount)} size={144} level="M" />
            </div>
            <div>
              <p className="font-semibold text-[color:var(--ink-forest)]">{c.qrTitle}</p>
              <p className="mt-1 text-sm text-foreground/80">{c.qrBody}</p>
              <p className={`${label} mt-4`}>{c.qrAmount}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[40, 50, 100, 250].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setQrAmount(a)}
                    className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold ${qrAmount === a ? on : off}`}
                  >
                    {L === "en" ? `€${a}` : `${a} €`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setQrAmount(null)}
                  className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold ${qrAmount === null ? on : off}`}
                >
                  {c.other}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl bg-[color:var(--color-sage)]/15 p-4">
            <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--ink-forest)]" />
            <div className="text-sm">
              <p className="font-semibold text-[color:var(--ink-forest)]">{c.taxTitle}</p>
              <p className="mt-1 text-foreground/85">{fill(c.taxBody, { min: ARC_EN_CIEL.taxMinimumEur })}</p>
              <p className="mt-2 text-xs text-muted-foreground">{c.standingOrder}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
