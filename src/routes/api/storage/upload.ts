/**
 * POST /api/storage/upload  (multipart: file, folder)
 * Uploadt een beeld via de server naar de bucket. Zo is er geen CORS-regel
 * op de bucket nodig en werkt het op elk domein (Lovable, Vercel, eigen domein).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 4 * 1024 * 1024;
const folderSchema = z.string().min(1).max(40);

export const Route = createFileRoute("/api/storage/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardApiRouteAny } = await import("@/lib/route-permission.server");
        const { UPLOAD_PERMISSIONS } = await import("@/lib/permission-core.server");
        const guard = await guardApiRouteAny(request, UPLOAD_PERMISSIONS);
        if ("response" in guard) return guard.response;

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        const folder = folderSchema.safeParse(form?.get("folder"));
        if (!(file instanceof File) || !folder.success) {
          return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
        }
        if (!ALLOWED.includes(file.type)) {
          return Response.json(
            { error: "Enkel JPG, PNG, WebP, AVIF of GIF worden ondersteund." },
            { status: 400 },
          );
        }
        if (file.size > MAX_BYTES) {
          return Response.json({ error: "Dit bestand is groter dan 4 MB." }, { status: 413 });
        }
        try {
          const { putObject, safeUploadKey } = await import("@/lib/s3.server");
          const fileKey = safeUploadKey(folder.data, file.name || "upload");
          const publicUrl = await putObject({
            fileKey,
            body: new Uint8Array(await file.arrayBuffer()),
            contentType: file.type,
          });
          return Response.json({ fileKey, publicUrl });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Onbekende fout";
          console.error(`S3 upload failed: ${message}`);
          return Response.json(
            { error: `Opslaan in de fotobibliotheek mislukt: ${message}` },
            { status: 500 },
          );
        }
      },
    },
  },
});
