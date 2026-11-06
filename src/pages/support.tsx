import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { MastodonShareButton } from "@/components/social/MastodonShareButton";
import { useT } from "@/lib/i18n";
import { deepTx } from "@/lib/i18n-extra";
import type { Lang } from "@/lib/i18n";
import { GiftPanels } from "@/components/support/GiftPanels";
import { LocalLink } from "@/components/LocalLink";
import { subPathFor } from "@/lib/routes-i18n";

const COPY: Record<
  Lang,
  {
    formTitle: string;
    formBody: string;
    thanks: string;
    structuredRef: string;
    amountPlaceholder: string;
    nameLabel: string;
    emailLabel: string;
    submit: string;
    failed: string;
    sponsorTitle: string;
    sponsorBody: string;
    sponsorCta: string;
  }
> = {
  nl: {
    formTitle: "Bevestig je gift",
    formBody:
      "Laat je gegevens achter en we sturen je meteen een bevestiging met het bedrag, onze rekeninggegevens en een gestructureerde mededeling voor je overschrijving.",
    thanks: "Bedankt! De bevestiging is onderweg naar {email}.",
    structuredRef: "Gestructureerde mededeling",
    amountPlaceholder: "Ander bedrag",
    nameLabel: "Naam",
    emailLabel: "E-mailadres",
    submit: "Stuur mij de bevestiging",
    failed: "Versturen lukte niet. Probeer later opnieuw.",
    sponsorTitle: "Word Peter of Meter",
    sponsorBody: "Adopteer symbolisch een dier van de boerderij en steun hun dagelijkse zorg.",
    sponsorCta: "Ontdek Peter/Meterschap",
  },
  fr: {
    formTitle: "Confirmez votre don",
    formBody:
      "Laissez vos coordonnées et nous vous envoyons aussitôt une confirmation avec le montant, nos coordonnées bancaires et une communication structurée pour votre virement.",
    thanks: "Merci ! La confirmation est en route vers {email}.",
    structuredRef: "Communication structurée",
    amountPlaceholder: "Autre montant",
    nameLabel: "Nom",
    emailLabel: "Adresse e-mail",
    submit: "Envoyez-moi la confirmation",
    failed: "L'envoi a échoué. Réessayez plus tard.",
    sponsorTitle: "Devenez marraine ou parrain",
    sponsorBody: "Adoptez symboliquement un animal de la ferme et soutenez ses soins quotidiens.",
    sponsorCta: "Découvrir le parrainage",
  },
  en: {
    formTitle: "Confirm your donation",
    formBody:
      "Leave your details and we'll immediately send you a confirmation with the amount, our account details and a structured reference for your transfer.",
    thanks: "Thank you! The confirmation is on its way to {email}.",
    structuredRef: "Structured reference",
    amountPlaceholder: "Other amount",
    nameLabel: "Name",
    emailLabel: "E-mail address",
    submit: "Send me the confirmation",
    failed: "Sending failed. Please try again later.",
    sponsorTitle: "Become a sponsor",
    sponsorBody: "Symbolically adopt a farm animal and support their daily care.",
    sponsorCta: "Discover sponsorship",
  },
};


export function SupportPage() {
  const { t, lang, tx } = useT();
  const c0 = deepTx(tx, COPY[lang]);
  const GOALS = [
    { title: t("support.goal.food"), body: t("support.goal.food.body"), amount: "€25" },
    { title: t("support.goal.workshop"), body: t("support.goal.workshop.body"), amount: "€80" },
    { title: t("support.goal.shelter"), body: t("support.goal.shelter.body"), amount: "€150" },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)] text-foreground">
      <NavHeader />
      <PagePhotoBand photo="schapen" />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 md:px-8 md:pt-16">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-[2rem] border border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/10 px-6 py-14 md:px-14 md:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--color-terracotta)]/10 blur-2xl"
          />
          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-terracotta)]">
              {t("support.title")}
            </p>
            <h1 className="font-serif mt-5 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] sm:text-5xl md:text-6xl">
              {t("support.lede")}
            </h1>
            <div className="mt-8 h-px w-24 bg-[color:var(--color-terracotta)]/50" />
          </div>
        </header>

        <GiftPanels />

        <MastodonShareButton className="mt-8" text={t("support.title")} />

        {/* Sponsorship */}
        <section className="mt-14 rounded-3xl border border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/10 p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl italic text-[color:var(--ink-forest)] md:text-3xl">
            {c0.sponsorTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{c0.sponsorBody}</p>
          <LocalLink
            to={subPathFor("support", lang, "sponsor")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-terracotta)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-terracotta)] hover:bg-[color:var(--color-terracotta)]/10"
          >
            💚 {c0.sponsorCta}
          </LocalLink>
        </section>

        {/* Concrete goals */}
        <section className="mt-20">
          <h2 className="font-serif text-3xl italic text-[color:var(--ink-forest)] md:text-4xl">
            {t("support.goals.title")}
          </h2>
          <div className="mt-3 h-px w-20 bg-[color:var(--color-terracotta)]/50" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {GOALS.map((g) => (
              <div
                key={g.title}
                className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--color-terracotta)]/40 hover:shadow-md"
              >
                <span className="inline-flex w-fit rounded-full bg-[color:var(--color-terracotta)]/10 px-4 py-1.5 font-serif text-2xl italic text-[color:var(--color-terracotta)]">
                  {g.amount}
                </span>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-[color:var(--ink-forest)]">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{g.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
