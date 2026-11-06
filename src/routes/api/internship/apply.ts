import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CV_MAX_BYTES, CV_TYPES, INTERNSHIPS } from "@/lib/internships";

/**
 * Stagekandidatuur met cv (verplicht) en motivatiebrief (optioneel).
 * De bestanden gaan als bijlage naar de stage-inbox; niets wordt bewaard.
 */
const fields = z.object({
  internship: z.string().max(40),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  studies: z.string().trim().min(2).max(200),
  school: z.string().trim().min(2).max(200),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.string().trim().min(1).max(120),
  days: z.string().max(40),
  notes: z.string().max(3000).optional(),
  requirementOk: z.string().optional(),
  website_hp: z.string().max(200).optional(),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

async function toAttachment(f: File | null, label: string) {
  if (!f || f.size === 0) return null;
  if (f.size > CV_MAX_BYTES) throw new Error("file_too_large");
  if (!CV_TYPES.includes(f.type)) throw new Error("file_type");
  const buf = new Uint8Array(await f.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const ext = f.name.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "pdf";
  return { name: `${label}.${ext}`, content: btoa(bin) };
}

export const Route = createFileRoute("/api/internship/apply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        if (!(await checkRateLimit("internship-apply", clientIdentifier(request.headers), 5, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        const raw = Object.fromEntries(
          [...form.entries()].filter(([, v]) => typeof v === "string"),
        ) as Record<string, string>;
        const parsed = fields.safeParse(raw);
        if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
        const d = parsed.data;
        if (d.website_hp?.trim()) return Response.json({ ok: true });

        const internship = INTERNSHIPS.find((i) => i.id === d.internship);
        if (!internship) return Response.json({ error: "invalid_input" }, { status: 400 });
        if (internship.requirement && d.requirementOk !== "yes") {
          return Response.json({ error: "requirement" }, { status: 400 });
        }

        const safe = d.name.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
        let attachment;
        try {
          const cv = await toAttachment(form.get("cv") as File | null, `cv-${safe}`);
          if (!cv) return Response.json({ error: "cv_required" }, { status: 400 });
          const letter = await toAttachment(form.get("letter") as File | null, `motivatie-${safe}`);
          attachment = letter ? [cv, letter] : [cv];
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "file" }, { status: 400 });
        }

        const { brevoEnv, brevoRoute, brevoSender } = await import("@/lib/brevo");
        const { escapeHtml } = await import("@/lib/email-shell");
        const { recipientsFor } = await import("@/lib/contact-routes.server");
        const apiKey = brevoEnv("BREVO_API_KEY");
        if (!apiKey) return Response.json({ error: "mail_unavailable" }, { status: 503 });

        const rows: [string, string][] = [
          ["Stage", internship.title.nl],
          ["Naam", d.name],
          ["E-mail", d.email],
          ["Telefoon", d.phone || "—"],
          ["Studies", d.studies],
          ["School", d.school],
          ["Start", d.start],
          ["Duur", d.duration],
          ["Dagen", d.days || "—"],
          ...(internship.requirement ? ([["Vervoer bevestigd", "ja"]] as [string, string][]) : []),
          ["Taal", d.lang],
        ];
        const html = `<h2 style="font-family:Georgia,serif">Nieuwe stagekandidatuur — ${escapeHtml(internship.title.nl)}</h2>
          <table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${rows
            .map(([k, v]) => `<tr><td style="color:#6b6b6b">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
            .join("")}</table>
          ${d.notes ? `<p style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(d.notes)}</p>` : ""}`;

        try {
          const to = await recipientsFor("stages");
          const route = brevoRoute(apiKey, brevoEnv("LOVABLE_API_KEY"));
          const res = await fetch(route.url("smtp/email"), {
            method: "POST",
            headers: route.headers,
            body: JSON.stringify({
              sender: brevoSender(),
              replyTo: { email: d.email, name: d.name },
              to: to.map((email) => ({ email })),
              subject: `Stagekandidatuur ${internship.title.nl} — ${d.name}`,
              htmlContent: html,
              attachment,
            }),
          });
          if (!res.ok) {
            console.error("[internship] Brevo", res.status, (await res.text()).slice(0, 300));
            return Response.json({ error: "mail_failed" }, { status: 502 });
          }
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[internship] versturen mislukt", err);
          return Response.json({ error: "mail_failed" }, { status: 502 });
        }
      },
    },
  },
});
