import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type SpacePhoto = { src: string; alt: string };

/** Foto's van een ruimte: grote foto, miniaturen en volledig scherm met pijltjes. */
export function SpacePhotos({ photos, label }: { photos: SpacePhoto[]; label: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  if (photos.length === 0) return null;
  const cur = photos[i]!;
  const go = (d: number) => setI((n) => (n + d + photos.length) % photos.length);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-muted"
        aria-label={`${label}: ${cur.alt}`}
      >
        <img src={cur.src} alt={cur.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground">
          <Expand className="h-3 w-3" /> {i + 1}/{photos.length}
        </span>
      </button>
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, n) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setI(n)}
              aria-label={p.alt}
              aria-current={n === i}
              className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${n === i ? "border-[color:var(--color-terracotta)]" : "border-transparent opacity-75 hover:opacity-100"}`}
            >
              <img src={p.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl border-none bg-background p-2 sm:p-3"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <div className="relative">
            <img src={cur.src} alt={cur.alt} className="max-h-[80vh] w-full rounded-xl object-contain" />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="←" className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="→" className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <p className="px-2 pb-1 text-sm text-muted-foreground">{cur.alt}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
