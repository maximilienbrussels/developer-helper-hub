import { createFileRoute } from "@tanstack/react-router";
import { BIRTHDAY_PACKAGES } from "@/lib/birthday-packages";
import { waitlistDateError, waitlistSchema } from "@/lib/birthday-waitlist";

/**
 * Wachtlijst kinderfeestje: mail naar de familie-inbox (antwoorden gaat
 * rechtstreeks naar de ouder) en een bevestiging naar de ouder.
 */
const CONFIRM = {
  nl: {
    subject: "Je staat op de wachtlijst voor een kinderfeestje",
    hi: (n: string) => `Dag ${n},`,
    body: "Bedankt! We hebben je op de wachtlijst gezet. Zodra een van je data vrijkomt, bellen of mailen we je meteen.",
    dates: "Gewenste datum",
    alt: "Alternatieven",
  },
  fr: {
    subject: "Vous êtes sur la liste d'attente pour un anniversaire",
    hi: (n: string) => `Bonjour ${n},`,
    body: "Merci ! Vous êtes bien sur la liste d'attente. Dès qu'une de vos dates se libère, nous vous appelons ou vous écrivons.",
    dates: "Date souhaitée",
    alt: "Alternatives",
  },
  en: {
    subject: "You're on the waiting list for a birthday party",
    hi: (n: string) => `Hi ${n},`,
    body: "Thank you! You're on the waiting list. As soon as one of your dates frees up, we'll call or e-mail you.",
    dates: "Preferred date",
    alt: "Alternatives",
  },
} as const;

function fmt(iso: string, lang: "nl" | "fr" | "en") {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(
    lang === "nl" ? "nl-BE" : lang === "fr" ? "fr-BE" : "en-GB",
    { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );
}

export const Route = createFileRoute("/api/birthday/waitlist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        if (!(await checkRateLimit("birthday-waitlist", clientIdentifier(request.headers), 5, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        const parsed = waitlistSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
        const d = parsed.data;
        if (d.website_hp?.trim()) return Response.json({ ok: true });

        const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
        const dateErr = waitlistDateError(d, today);
        if (dateErr) return Response.json({ error: dateErr }, { status: 400 });
        const pkg = BIRTHDAY_PACKAGES.find((p) => p.slug === d.packageSlug)!;

        const { brevoEnv, brevoRoute, brevoSender } = await import("@/lib/brevo");
        const { shell, infoCard, escapeHtml, paragraphs } = await import("@/lib/email-shell");
        const { recipientsFor } = await import("@/lib/contact-routes.server");
        const apiKey = brevoEnv("BREVO_API_KEY");
        if (!apiKey) return Response.json({ error: "mail_unavailable" }, { status: 503 });
        const route = brevoRoute(apiKey, brevoEnv("LOVABLE_API_KEY"));
        const name = `${d.firstName} ${d.lastName}`;

        const send = (payload: Record<string, unknown>) =>
          fetch(route.url("smtp/email"), {
            method: "POST",
            headers: route.headers,
            body: JSON.stringify({ sender: brevoSender(), ...payload }),
          });

        try {
          const to = await recipientsFor("familie");
          const rows: [string, string][] = [
            ["Formule", pkg.copy.nl.title],
            ["Gewenste datum", fmt(d.date, "nl")],
            ["Alternatieven", d.alternatives.length ? d.alternatives.map((a) => fmt(a, "nl")).join(" · ") : "—"],
            ["Aantal kinderen", d.children ? String(d.children) : "—"],
            ["Naam", name],
            ["Telefoon", d.phone],
            ["E-mail", d.email],
            ["Taal", d.lang],
          ];
          const teamHtml = shell({
            preview: `Wachtlijst: ${name} wil ${fmt(d.date, "nl")}`,
            kicker: "Wachtlijst",
            title: "Nieuwe aanvraag kinderfeestje",
            body: rows.map(([k, v]) => infoCard(k, v)).join("") + (d.note ? paragraphs(d.note) : ""),
            hideDisclaimer: true,
          });
          const res = await send({
            replyTo: { email: d.email, name },
            to: to.map((email) => ({ email })),
            subject: `Wachtlijst kinderfeestje ${fmt(d.date, "nl")} — ${name}`,
            htmlContent: teamHtml,
          });
          if (!res.ok) {
            console.error("[birthday-waitlist] Brevo", res.status, (await res.text()).slice(0, 300));
            return Response.json({ error: "mail_failed" }, { status: 502 });
          }

          const c = CONFIRM[d.lang];
          const confirmHtml = shell({
            preview: c.body,
            title: c.subject,
            lang: d.lang,
            body:
              `<p>${escapeHtml(c.hi(d.firstName))}</p>` +
              paragraphs(c.body) +
              infoCard(c.dates, fmt(d.date, d.lang)) +
              (d.alternatives.length ? infoCard(c.alt, d.alternatives.map((a) => fmt(a, d.lang)).join(" · ")) : ""),
          });
          // De bevestiging is een extraatje: mislukt ze, dan staat de aanvraag toch al bij het team.
          await send({ to: [{ email: d.email, name }], subject: c.subject, htmlContent: confirmHtml }).catch(
            (e) => console.error("[birthday-waitlist] bevestiging", e),
          );
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[birthday-waitlist] versturen mislukt", err);
          return Response.json({ error: "mail_failed" }, { status: 502 });
        }
      },
    },
  },
});
