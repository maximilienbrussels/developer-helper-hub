import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { donationCents } from "@/lib/donation";

/**
 * Online gift: Stripe Checkout, eenmalig (payment) of maandelijks
 * (subscription). Het bedrag wordt hier opnieuw gevalideerd.
 */
const schema = z.object({
  amountEur: z.number(),
  frequency: z.enum(["once", "monthly"]),
  name: z.string().max(120).optional(),
  email: z.string().email().max(160),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
  returnPath: z.string().startsWith("/").max(200).optional(),
});

const LABEL = {
  nl: { once: "Gift aan de Ferme du Parc Maximilien", monthly: "Maandelijkse gift aan de Ferme du Parc Maximilien" },
  fr: { once: "Don à la Ferme du Parc Maximilien", monthly: "Don mensuel à la Ferme du Parc Maximilien" },
  en: { once: "Donation to the Ferme du Parc Maximilien", monthly: "Monthly donation to the Ferme du Parc Maximilien" },
} as const;

export const Route = createFileRoute("/api/donation/create-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        if (!(await checkRateLimit("donation-session", clientIdentifier(request.headers), 15, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }

        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        const cents = donationCents(input.amountEur);
        if (!cents) return Response.json({ error: "invalid_amount" }, { status: 400 });

        const { stripeConfigured, stripeServer } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) {
          return Response.json({ error: "stripe_not_configured" }, { status: 503 });
        }

        const origin = (() => {
          const raw = request.headers.get("origin") ?? request.headers.get("referer");
          try {
            if (raw) return new URL(raw).origin;
          } catch {
            /* productiedomein */
          }
          return "https://maximilien.brussels";
        })();
        const back = input.returnPath && !input.returnPath.startsWith("//") ? input.returnPath : "/steun";
        const monthly = input.frequency === "monthly";
        const metadata = {
          kind: "donation",
          frequency: input.frequency,
          donor_name: input.name ?? "",
          lang: input.lang,
        };

        try {
          const session = await stripeServer().checkout.sessions.create({
            mode: monthly ? "subscription" : "payment",
            customer_email: input.email,
            locale: input.lang,
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: cents,
                  ...(monthly ? { recurring: { interval: "month" as const } } : {}),
                  product_data: { name: LABEL[input.lang][input.frequency] },
                },
              },
            ],
            metadata,
            ...(monthly
              ? { subscription_data: { metadata } }
              : { payment_intent_data: { metadata }, submit_type: "donate" as const }),
            success_url: `${origin}${back}?gift=success`,
            cancel_url: `${origin}${back}?gift=cancelled`,
          });
          return Response.json({ url: session.url });
        } catch (err) {
          console.error("[donation] sessie aanmaken mislukt", err);
          return Response.json({ error: "stripe_error" }, { status: 500 });
        }
      },
    },
  },
});
