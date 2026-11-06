import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { cancelRegistration } from "@/lib/event-signup.functions";

const TITLE = "Inschrijving annuleren — Maximilien";
const DESC = "Annuleer je inschrijving voor een evenement op de stadsboerderij, zodat iemand op de wachtlijst je plaats krijgt.";

export const Route = createFileRoute("/inschrijving/annuleren")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: z.object({ token: z.string().optional() }),
  component: CancelPage,
});

/** Bewust een knop (geen automatische annulering): mailscanners openen links ook. */
function CancelPage() {
  const { token } = Route.useSearch();
  const cancel = useServerFn(cancelRegistration);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [title, setTitle] = useState("");

  async function run() {
    if (!token) return;
    setState("busy");
    try {
      const r = await cancel({ data: { token } });
      if (r.ok) { setTitle(r.title ?? ""); setState("done"); } else setState("error");
    } catch { setState("error"); }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">Maximilien</p>
      {state === "done" ? (
        <>
          <CheckCircle2 className="mx-auto mt-6 h-12 w-12 text-[color:var(--color-sage)]" />
          <h1 className="font-serif mt-4 text-3xl text-[color:var(--ink-forest)]">Inschrijving geannuleerd</h1>
          <p className="mt-3 text-sm text-muted-foreground">{title ? `${title}. ` : ""}Bedankt om je plaats vrij te geven. · Merci d'avoir libéré ta place. · Thanks for freeing up your place.</p>
        </>
      ) : (
        <>
          <h1 className="font-serif mt-4 text-3xl text-[color:var(--ink-forest)]">Inschrijving annuleren?</h1>
          <p className="mt-3 text-sm text-muted-foreground">Annuler l'inscription ? · Cancel your registration?</p>
          {!token || state === "error" ? (
            <p role="alert" className="mt-6 text-sm text-destructive">Deze link is ongeldig of het evenement is voorbij. · Lien invalide ou événement passé. · Invalid link or past event.</p>
          ) : (
            <button type="button" onClick={run} disabled={state === "busy"} className="mx-auto mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[12px] font-semibold uppercase tracking-widest text-[color:var(--color-cream)] hover:bg-[color:var(--color-terracotta)] disabled:opacity-60">
              {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" />} Ja, annuleren · Oui, annuler · Yes, cancel
            </button>
          )}
        </>
      )}
      <Link to="/" className="mt-10 text-sm text-[color:var(--color-terracotta)] underline-offset-2 hover:underline">maximilien.brussels</Link>
    </main>
  );
}
