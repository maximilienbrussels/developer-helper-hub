/** Inschrijvingen per evenement: instellingen (capaciteit, prijs, beschrijving) en deelnemerslijst. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Users, XCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminCancelRegistration, getEventSignupAdmin, saveEventSignupAdmin,
  type AdminRegistration, type EventSignupSettings,
} from "@/lib/event-signup.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS: Record<AdminRegistration["status"], string> = {
  confirmed: "Bevestigd", pending: "Wacht op betaling", waitlist: "Wachtlijst", cancelled: "Geannuleerd",
};

function csv(rows: AdminRegistration[], title: string) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [["Naam", "E-mail", "Telefoon", "Personen", "Status", "Bedrag", "Opmerking", "Ingeschreven"].map(q).join(";"),
    ...rows.map((r) => [r.name, r.email, r.phone, r.seats, STATUS[r.status], (r.amountCents / 100).toFixed(2), r.note, r.createdAt.slice(0, 16)].map(q).join(";"))];
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `deelnemers-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
  a.click();
}

export function EventSignupDialog({ eventId, title }: { eventId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const load = useServerFn(getEventSignupAdmin);
  const save = useServerFn(saveEventSignupAdmin);
  const cancel = useServerFn(adminCancelRegistration);
  const [s, setS] = useState<EventSignupSettings | null>(null);
  const [regs, setRegs] = useState<AdminRegistration[]>([]);
  const [price, setPrice] = useState("0");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const r = await load({ data: { eventId } });
    setS(r.settings); setRegs(r.registrations); setPrice((r.settings.priceCents / 100).toFixed(2));
  }
  useEffect(() => { if (open) void refresh().catch(() => toast.error("Laden mislukt")); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  async function onSave() {
    if (!s) return;
    const cents = Math.round(Number(price.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) { toast.error("Ongeldige prijs"); return; }
    setBusy(true);
    try {
      await save({ data: { eventId, ...s, priceCents: cents } });
      toast.success("Inschrijvingen opgeslagen");
      await refresh();
    } catch { toast.error("Opslaan mislukt"); } finally { setBusy(false); }
  }

  const confirmed = regs.filter((r) => r.status === "confirmed").reduce((n, r) => n + r.seats, 0);
  const waiting = regs.filter((r) => r.status === "waitlist").reduce((n, r) => n + r.seats, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Users className="size-4" /> Inschrijvingen</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {!s ? <Loader2 className="mx-auto my-8 size-6 animate-spin" /> : (
          <Tabs defaultValue="people">
            <TabsList>
              <TabsTrigger value="people">Deelnemers ({confirmed}{s.capacity ? ` / ${s.capacity}` : ""})</TabsTrigger>
              <TabsTrigger value="settings">Instellingen</TabsTrigger>
            </TabsList>
            <TabsContent value="people" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>{confirmed} bevestigd · {waiting} op wachtlijst</span>
                <Button size="sm" variant="outline" disabled={!regs.length} onClick={() => csv(regs, title)}><Download className="size-4" /> CSV</Button>
              </div>
              {regs.length === 0 ? <p className="text-sm text-muted-foreground">Nog geen inschrijvingen.</p> : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {regs.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="font-semibold">{r.name}</span> · {r.seats}p
                        <span className="block text-xs text-muted-foreground">{r.email}{r.phone ? ` · ${r.phone}` : ""}{r.note ? ` — ${r.note}` : ""}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.status === "confirmed" ? "bg-success/15 text-success" : r.status === "waitlist" ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{STATUS[r.status]}</span>
                        {r.status !== "cancelled" && (
                          <Button size="icon" variant="ghost" className="size-8 text-destructive" aria-label="Annuleren"
                            onClick={async () => { await cancel({ data: { id: r.id } }); toast.success("Geannuleerd; wachtlijst bijgewerkt"); await refresh(); }}>
                            <XCircle className="size-4" />
                          </Button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="settings" className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="su-open">Online inschrijven toestaan</Label>
                <Switch id="su-open" checked={s.registrationOpen} onCheckedChange={(v) => setS({ ...s, registrationOpen: v })} />
              </div>
              <p className="text-xs text-muted-foreground">Het evenement moet ook op "publiek zichtbaar" staan om in de agenda te verschijnen.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="su-cap">Max. personen (leeg = onbeperkt)</Label>
                  <Input id="su-cap" type="number" min={1} value={s.capacity ?? ""} onChange={(e) => setS({ ...s, capacity: e.target.value ? Math.max(1, Number(e.target.value)) : null })} />
                </div>
                <div>
                  <Label htmlFor="su-price">Prijs per persoon (€, 0 = gratis)</Label>
                  <Input id="su-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="su-aud">Doelpubliek (bv. "gezinnen, 6+")</Label>
                <Input id="su-aud" maxLength={120} value={s.audience} onChange={(e) => setS({ ...s, audience: e.target.value })} />
              </div>
              {(["Nl", "Fr", "En"] as const).map((l) => (
                <div key={l}>
                  <Label htmlFor={`su-d${l}`}>Beschrijving {l.toUpperCase()}</Label>
                  <Textarea id={`su-d${l}`} rows={3} maxLength={2000} value={s[`description${l}`]} onChange={(e) => setS({ ...s, [`description${l}`]: e.target.value })} />
                </div>
              ))}
              <Button onClick={onSave} disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Opslaan</Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
