import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { INVITATION_LIMITS as M, PRINT_PRICE_PER_CARD_CENTS, DELIVERY_CENTS, invitationTotalCents } from "@/lib/invitation";

/** Gedrukte uitnodigingskaarten bestellen: ophalen op de boerderij of per post (BE). */
const schema = z.object({
  qty: z.number().int(),
  delivery: z.enum(["pickup", "post"]),
  email: z.string().email().max(160),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
  card: z.object({
    cardLang: z.enum(["nl", "fr", "en"]),
    guest: z.string().max(M.guest),
    child: z.string().min(1).max(M.child),
    age: z.string().max(M.age),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    from: z.string().regex(/^\d{2}:\d{2}$/),
    to: z.string().regex(/^\d{2}:\d{2}$/),
    rsvpName: z.string().max(M.rsvpName),
    rsvpPhone: z.string().max(M.rsvpPhone),
    rsvpBy: z.string().max(10),
    note: z.string().max(M.note),
  }),
});

const NAME = {
  nl: "Gedrukte uitnodigingskaarten (Mijn feest op de boerderij)",
  fr: "Cartons d'invitation imprimés (Ma fête champêtre)",
  en: "Printed invitation cards (My farm party)",
};
const SHIP = { nl: "Verzending per post (België)", fr: "Envoi postal (Belgique)", en: "Postal delivery (Belgium)" };

export const Route = createFileRoute("/api/invitation/order-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        if (!(await checkRateLimit("invitation-order", clientIdentifier(request.headers), 10, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }
        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        if (invitationTotalCents(input.qty, input.delivery) === null) {
          return Response.json({ error: "invalid_qty" }, { status: 400 });
        }
        const { stripeConfigured, stripeServer } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) return Response.json({ error: "stripe_not_configured" }, { status: 503 });

        let origin = "https://maximilien.brussels";
        try {
          const raw = request.headers.get("origin") ?? request.headers.get("referer");
          if (raw) origin = new URL(raw).origin;
        } catch {
          /* standaarddomein */
        }
        const c = input.card;
        const session = await stripeServer().checkout.sessions.create({
          mode: "payment",
          customer_email: input.email,
          locale: input.lang,
          line_items: [
            { quantity: input.qty, price_data: { currency: "eur", unit_amount: PRINT_PRICE_PER_CARD_CENTS, product_data: { name: NAME[input.lang] } } },
            ...(input.delivery === "post"
              ? [{ quantity: 1, price_data: { currency: "eur", unit_amount: DELIVERY_CENTS, product_data: { name: SHIP[input.lang] } } }]
              : []),
          ],
          ...(input.delivery === "post"
            ? { shipping_address_collection: { allowed_countries: ["BE" as const] } }
            : {}),
          phone_number_collection: { enabled: true },
          metadata: {
            kind: "invitation",
            qty: String(input.qty),
            delivery: input.delivery,
            lang: input.lang,
            card_lang: c.cardLang,
            card_people: `${c.child} | ${c.age} | gast: ${c.guest || "(leeg)"}`.slice(0, 500),
            card_when: `${c.date} ${c.from}-${c.to}`,
            card_rsvp: `${c.rsvpName} ${c.rsvpPhone} ${c.rsvpBy}`.slice(0, 500),
            card_note: c.note.slice(0, 500),
          },
          success_url: `${origin}/bezoekers/familie?uitnodiging=besteld#uitnodiging`,
          cancel_url: `${origin}/bezoekers/familie#uitnodiging`,
        });
        return Response.json({ url: session.url });
      },
    },
  },
});
