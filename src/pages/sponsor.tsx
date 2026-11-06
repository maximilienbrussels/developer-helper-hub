import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { NavHeader } from "@/components/NavHeader";
import { formatT, useT } from "@/lib/i18n";
import { deepTx } from "@/lib/i18n-extra";
import type { Lang } from "@/lib/i18n";
import { ResidentPhoto } from "@/components/ResidentPhoto";
import { useAlbumPhotos } from "@/lib/use-album-photos";
import { speciesIn } from "@/lib/routes-i18n";
import { handleImageError } from "@/lib/image-fallback";
import { animalsQO } from "@/pages/animals";

import {
  SPONSOR_CATEGORIES,
  categoryForSpecies,
  monthlyEur,
  tierFor,
  type SponsorCategoryId,
} from "@/lib/sponsor-tiers";
import { OLD_ASSETS } from "@/lib/old-site-assets";

const CATEGORY_ART: Record<SponsorCategoryId, string> = {
  alpaca: OLD_ASSETS.peterAlpaca,
  "ezel-pony": OLD_ASSETS.peterEzelPony,
  bijenkorf: OLD_ASSETS.peterBijenkorf,
  "geit-schaap": OLD_ASSETS.peterGeitSchaap,
  fruitboom: OLD_ASSETS.peterFruitboom,
  "klein-dier": OLD_ASSETS.peterKleineDieren,
};

const EXTRA: Record<"nl" | "fr" | "en", {
  perYear: string; perMonth: string; orMonthly: string; includes: string; pickAnimal: string;
  anyAnimal: string; interval: string; yearly: string; monthly: string; standaloneNote: string;
  summary: string; giftHint: string;
}> = {
  nl: {
    perYear: "per jaar", perMonth: "per maand", orMonthly: "of {m} € per maand",
    includes: "Met persoonlijk certificaat en een lintje met jouw naam op de boerderij.",
    pickAnimal: "2. Kies je dier", anyAnimal: "Laat het team kiezen",
    interval: "3. Hoe wil je betalen?", yearly: "Per jaar", monthly: "Per maand",
    standaloneNote: "Je naam komt op een lintje bij de {what}.",
    summary: "{what} · {price}", giftHint: "Een peterschap cadeau doen? Vul gewoon de naam van de gelukkige in; het certificaat komt op die naam.",
  },
  fr: {
    perYear: "par an", perMonth: "par mois", orMonthly: "ou {m} € par mois",
    includes: "Avec un certificat personnel et un ruban à votre nom à la ferme.",
    pickAnimal: "2. Choisissez votre animal", anyAnimal: "Laisser l'équipe choisir",
    interval: "3. Comment voulez-vous payer ?", yearly: "Par an", monthly: "Par mois",
    standaloneNote: "Votre nom figurera sur un ruban près de la {what}.",
    summary: "{what} · {price}", giftHint: "Offrir un parrainage ? Indiquez le nom de l'heureux élu ; le certificat sera à ce nom.",
  },
  en: {
    perYear: "per year", perMonth: "per month", orMonthly: "or €{m} a month",
    includes: "With a personal certificate and a ribbon with your name at the farm.",
    pickAnimal: "2. Pick your animal", anyAnimal: "Let the team choose",
    interval: "3. How would you like to pay?", yearly: "Yearly", monthly: "Monthly",
    standaloneNote: "Your name goes on a ribbon by the {what}.",
    summary: "{what} · {price}", giftHint: "Giving a sponsorship as a gift? Just enter the lucky person's name; the certificate will be in their name.",
  },
};

const COPY: Record<
  Lang,
  {
    title: string;
    lede: string;
    step1: string;
    step2: string;
    step3: string;
    nameLabel: string;
    emailLabel: string;
    cta: string;
    unavailable: string;
    processing: string;
    thanksTitle: string;
    thanksBody: string;
    download: string;
    error: string;
    back: string;
  }
> = {
  nl: {
    title: "Word Peter of Meter",
    lede: "Adopteer symbolisch een dier van de boerderij en steun zo hun dagelijkse zorg, voeding en welzijn.",
    step1: "1. Wat wil je steunen?",
    step2: "2. Kies een formule",
    step3: "4. Jouw gegevens",
    nameLabel: "Naam",
    emailLabel: "E-mailadres",
    cta: "💚 Word Peter of Meter",
    unavailable: "Betalingen zijn tijdelijk niet beschikbaar. Probeer later opnieuw.",
    processing: "Je betaling wordt verwerkt…",
    thanksTitle: "Bedankt voor je steun! 💚",
    thanksBody: "Je bent nu officieel Peter/Meter van {animal}.",
    download: "Download certificaat",
    error: "Er ging iets mis. Probeer later opnieuw.",
    back: "Kies opnieuw",
  },
  fr: {
    title: "Devenez marraine ou parrain",
    lede: "Adoptez symboliquement un animal de la ferme et soutenez ses soins, sa nourriture et son bien-être au quotidien.",
    step1: "1. Que voulez-vous soutenir ?",
    step2: "2. Choisissez une formule",
    step3: "4. Vos coordonnées",
    nameLabel: "Nom",
    emailLabel: "Adresse e-mail",
    cta: "💚 Devenir marraine/parrain",
    unavailable: "Les paiements sont temporairement indisponibles. Réessayez plus tard.",
    processing: "Votre paiement est en cours de traitement…",
    thanksTitle: "Merci pour votre soutien ! 💚",
    thanksBody: "Vous êtes désormais officiellement marraine/parrain de {animal}.",
    download: "Télécharger le certificat",
    error: "Une erreur est survenue. Réessayez plus tard.",
    back: "Recommencer",
  },
  en: {
    title: "Become a sponsor",
    lede: "Symbolically adopt a farm animal and support their daily care, food and wellbeing.",
    step1: "1. What would you like to support?",
    step2: "2. Pick a tier",
    step3: "4. Your details",
    nameLabel: "Name",
    emailLabel: "Email address",
    cta: "💚 Become a sponsor",
    unavailable: "Payments are temporarily unavailable. Please try again later.",
    processing: "Your payment is being processed…",
    thanksTitle: "Thank you for your support! 💚",
    thanksBody: "You are now officially sponsoring {animal}.",
    download: "Download certificate",
    error: "Something went wrong. Please try again later.",
    back: "Start over",
  },
};

type Animal = { id: number; name: string; species: string; image_url: string | null };

type StatusResponse = {
  status: string;
  animalName?: string;
  tier?: string;
  certificateId?: string | null;
};

export function SponsorPage() {
  const { lang, tx } = useT();

  const c = deepTx(tx, COPY[lang]);
  const { data: animals } = useSuspenseQuery(animalsQO);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameFromCheckout, setCameFromCheckout] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success" && params.get("session_id")) {
      setCameFromCheckout(true);
      setSessionId(params.get("session_id"));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(`/api/sponsorship/status?session_id=${encodeURIComponent(sessionId ?? "")}`);
        const data = (await res.json()) as StatusResponse;
        if (stopped) return;
        setStatusData(data);
        if (data.status !== "paid") {
          setTimeout(poll, 2500);
        }
      } catch {
        if (!stopped) setTimeout(poll, 4000);
      }
    }
    poll();
    return () => {
      stopped = true;
    };
  }, [sessionId]);

  if (cameFromCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="mx-auto w-full max-w-2xl px-5 py-16 text-center">
          {statusData?.status === "paid" ? (
            <>
              <h1 className="font-serif text-3xl text-foreground">{c.thanksTitle}</h1>
              <p className="mt-4 text-muted-foreground">
                {formatT(c.thanksBody, { animal: statusData.animalName ?? "" })}
              </p>
              {statusData.certificateId ? (
                <a
                  href={`/api/sponsorship/certificate/${statusData.certificateId}`}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  {c.download}
                </a>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">{c.processing}</p>
          )}
        </main>
      </div>
    );
  }

  return <SponsorForm animals={(animals ?? []) as Animal[]} lang={lang} c={c} />;
}

function SponsorForm({
  animals,
  lang,
  c,
}: {
  animals: Animal[];
  lang: Lang;
  c: (typeof COPY)[Lang];
}) {
  const albumPhotos = useAlbumPhotos();
  const { tx } = useT();
  const L = lang === "fr" || lang === "en" ? lang : lang === "nl" ? "nl" : "en";
  const x = deepTx(tx, EXTRA[L]);
  const [category, setCategory] = useState<SponsorCategoryId | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [interval, setPayInterval] = useState<"year" | "month">("year");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(false);
  const cat = SPONSOR_CATEGORIES.find((k) => k.id === category) ?? null;
  const tier = cat ? tierFor(cat.id, interval) : null;
  const inCategory = cat && !cat.standalone ? animals.filter((a) => categoryForSpecies(a.species) === cat.id) : [];
  const targetName = cat
    ? cat.standalone
      ? tx(cat.label[L])
      : (animal?.name ?? tx(cat.label[L]))
    : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cat || !tier || busy) return;
    setBusy(true);
    setError(false);
    setUnavailable(false);
    try {
      const res = await fetch("/api/sponsorship/create-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          animalId: animal?.id ?? null,
          animalName: targetName,
          tierId: tier.id,
          sponsorName: name.trim(),
          sponsorEmail: email.trim(),
          lang,
        }),
      });
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto w-full max-w-4xl px-5 py-12">
        <h1 className="font-serif text-4xl text-foreground">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.lede}</p>

        <form onSubmit={submit} className="mt-10 space-y-10">
          <section>
            <h2 className="font-serif text-xl text-foreground">{c.step1}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{x.includes}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {SPONSOR_CATEGORIES.map((k) => (
                <button
                  type="button"
                  key={k.id}
                  aria-pressed={category === k.id}
                  onClick={() => {
                    setCategory(k.id);
                    setAnimal(null);
                  }}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-shadow hover:shadow-md ${
                    category === k.id ? "border-primary ring-2 ring-primary" : "border-border"
                  }`}
                >
                  <div className="aspect-square w-full bg-[color:var(--color-cream)]">
                    <img src={CATEGORY_ART[k.id]} alt="" loading="lazy" className="h-full w-full object-contain p-4" />
                  </div>
                  <div className="p-4">
                    <p className="font-serif text-lg text-foreground">{tx(k.label[L])}</p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--color-terracotta)]">
                      {L === "en" ? `€${k.yearlyEur}` : `${k.yearlyEur} €`} {x.perYear}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatT(x.orMonthly, { m: monthlyEur(k.yearlyEur) })}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {cat && !cat.standalone && (
            <section>
              <h2 className="font-serif text-xl text-foreground">{x.pickAnimal}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <button
                  type="button"
                  aria-pressed={animal === null}
                  onClick={() => setAnimal(null)}
                  className={`grid min-h-[120px] place-items-center rounded-2xl border bg-card p-4 text-center font-serif text-lg ${
                    animal === null ? "border-primary ring-2 ring-primary" : "border-border"
                  }`}
                >
                  {x.anyAnimal}
                </button>
                {inCategory.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    aria-pressed={animal?.id === a.id}
                    onClick={() => setAnimal(a)}
                    className={`overflow-hidden rounded-2xl border bg-card text-left transition-shadow hover:shadow-md ${
                      animal?.id === a.id ? "border-primary ring-2 ring-primary" : "border-border"
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <ResidentPhoto animal={a} albums={albumPhotos} speciesLabel={tx(speciesIn(a.species, lang))} />
                    </div>
                    <div className="p-3">
                      <p className="font-serif text-lg text-foreground">
                        {a.name} · {tx(speciesIn(a.species, lang))}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
          {cat?.standalone && (
            <p className="text-sm text-muted-foreground">{formatT(x.standaloneNote, { what: tx(cat.label[L]).toLowerCase() })}</p>
          )}

          {cat && (
            <section>
              <h2 className="font-serif text-xl text-foreground">{x.interval}</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {(["year", "month"] as const).map((iv) => (
                  <button
                    type="button"
                    key={iv}
                    aria-pressed={interval === iv}
                    onClick={() => setPayInterval(iv)}
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold ${
                      interval === iv ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"
                    }`}
                  >
                    {iv === "year" ? x.yearly : x.monthly} · {tx(tierFor(cat.id, iv).label[L])}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-serif text-xl text-foreground">{c.step3}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{x.giftHint}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.nameLabel}
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none"
                />
              </label>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.emailLabel}
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none"
                />
              </label>
            </div>
          </section>

          {unavailable ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {c.unavailable}
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{c.error}</p> : null}

          <button
            type="submit"
            disabled={!cat || !tier || !name.trim() || !email.trim() || busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {c.cta}
            {cat && tier ? ` · ${formatT(x.summary, { what: targetName, price: tx(tier.label[L]) })}` : ""}
          </button>
        </form>
      </main>
    </div>
  );
}
