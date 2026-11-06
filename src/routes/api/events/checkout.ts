import { createFileRoute } from "@tanstack/react-router";
import { registrationSchema } from "@/lib/event-signup.functions";

/** Betalend evenement: plaats 30 min. vasthouden en doorsturen naar Stripe. */
export const Route = createFileRoute("/api/events/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        if (!(await checkRateLimit("event-checkout", clientIdentifier(request.headers), 15, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }
        const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
        const data = parsed.data;
        if (data.website_hp?.trim()) return Response.json({ error: "invalid_input" }, { status: 400 });

        const { stripeConfigured, stripeServer } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) return Response.json({ error: "stripe_not_configured" }, { status: 503 });

        const { registerAtomic, sendRegistrationMail, PENDING_MINUTES } = await import("@/lib/event-signup.server");
        const res = await registerAtomic({ ...data, paid: true });
        if (!res.ok) return Response.json({ error: res.reason }, { status: 409 });
        if (res.status === "waitlist") {
          await sendRegistrationMail(res.id, "waitlist").catch(() => undefined);
          return Response.json({ status: "waitlist" });
        }

        let origin = "https://maximilien.brussels";
        try {
          const raw = request.headers.get("origin") ?? request.headers.get("referer");
          if (raw) origin = new URL(raw).origin;
        } catch {
          /* standaarddomein */
        }
        const title = res.event[`title_${data.lang}` as const] || res.event.title_nl;
        const session = await stripeServer().checkout.sessions.create({
          mode: "payment",
          customer_email: data.email,
          locale: data.lang,
          expires_at: Math.floor(Date.now() / 1000) + PENDING_MINUTES * 60,
          line_items: [
            {
              quantity: data.seats,
              price_data: {
                currency: "eur",
                unit_amount: res.event.price_cents,
                product_data: { name: `${title} — ${res.event.event_date}` },
              },
            },
          ],
          metadata: { kind: "event", registration_id: res.id, lang: data.lang },
          success_url: `${origin}/events?inschrijving=betaald`,
          cancel_url: `${origin}/events?inschrijving=geannuleerd`,
        });
        return Response.json({ url: session.url });
      },
    },
  },
});
