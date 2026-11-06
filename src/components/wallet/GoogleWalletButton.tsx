import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BellRing, Loader2, MapPin, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import googleAsset from "@/assets/google-wallet.png";
import { handleImageError } from "@/lib/image-fallback";
import { Switch } from "@/components/ui/switch";
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";
import { useNearbyFarm } from "@/lib/use-nearby-farm";

export type Locale = "nl" | "fr" | "en";

const SAVE_PREFIX = "https://pay.google.com/gp/v/save/";

const COPY = {
  nl: {
    title: "Mijn Hooi · digitale pas",
    member: "Lid",
    number: "Lidnummer",
    balance: "Hoefjes",
    tier: "Status",
    tierDefault: "Boerderijvriend",
    label: "Toevoegen aan Google Wallet",
    loading: "Je pas wordt klaargemaakt…",
    failed: "Kon de pas niet aanmaken.",
    notConfigured: "Google Wallet is hier nog niet beschikbaar — toon je QR-code aan de kassa.",
    retry: "Opnieuw proberen",
    apple: "Op iPhone? Toon deze QR-code aan de kassa — Apple Wallet volgt binnenkort.",
    nearbyTitle: "Melding als je in de buurt bent",
    nearbyBody: "We tonen een seintje met je pas zodra je bij de boerderij bent. Je locatie blijft op je toestel.",
    nearbyDenied: "Locatie is geblokkeerd in je browser. Sta het toe om deze melding te krijgen.",
    nearbyNow: "Je bent bij de boerderij! Toon je pas aan de kassa.",
    walletNote: "In Google Wallet verschijnt je pas ook vanzelf op je vergrendelscherm in de buurt.",
  },
  fr: {
    title: "Mijn Hooi · pass numérique",
    member: "Membre",
    number: "N° de membre",
    balance: "Hoefjes",
    tier: "Statut",
    tierDefault: "Ami de la ferme",
    label: "Ajouter à Google Wallet",
    loading: "Préparation de votre pass…",
    failed: "Impossible de créer le pass.",
    notConfigured: "Google Wallet n'est pas encore disponible ici — montrez votre QR à la caisse.",
    retry: "Réessayer",
    apple: "Sur iPhone ? Montrez ce QR à la caisse — Apple Wallet arrive bientôt.",
    nearbyTitle: "Notification à proximité",
    nearbyBody: "Nous affichons votre pass dès que vous êtes à la ferme. Votre position reste sur votre appareil.",
    nearbyDenied: "La localisation est bloquée dans votre navigateur. Autorisez-la pour recevoir cette notification.",
    nearbyNow: "Vous êtes à la ferme ! Montrez votre pass à la caisse.",
    walletNote: "Dans Google Wallet, votre pass apparaît aussi sur l'écran verrouillé à proximité.",
  },
  en: {
    title: "Mijn Hooi · digital pass",
    member: "Member",
    number: "Member no.",
    balance: "Hoefjes",
    tier: "Status",
    tierDefault: "Farm friend",
    label: "Add to Google Wallet",
    loading: "Preparing your pass…",
    failed: "Could not create the pass.",
    notConfigured: "Google Wallet is not available here yet — show your QR code at the desk.",
    retry: "Try again",
    apple: "On iPhone? Show this QR at the desk — Apple Wallet is coming soon.",
    nearbyTitle: "Notify me when I'm nearby",
    nearbyBody: "We'll pop up your pass as soon as you're at the farm. Your location stays on your device.",
    nearbyDenied: "Location is blocked in your browser. Allow it to get this notification.",
    nearbyNow: "You're at the farm! Show your pass at the desk.",
    walletNote: "In Google Wallet your pass also appears on your lock screen when you're nearby.",
  },
} as const;

export type GoogleWalletMemberButtonProps = {
  memberId: string;
  memberName: string;
  hooiBalance: number;
  tier?: string;
  locale?: Locale;
  className?: string;
};

type State = "loading" | "ready" | "unavailable" | "error";

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }) as never);
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Premium ledenpas met "Toevoegen aan Google Wallet" en melding in de buurt. */
export function GoogleWalletButton({
  memberId,
  memberName,
  hooiBalance,
  tier,
  locale = "nl",
  className = "",
}: GoogleWalletMemberButtonProps) {
  const [state, setState] = useState<State>("loading");
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const mounted = useRef(true);
  const c = COPY[locale] ?? COPY.nl;
  const nearby = useNearbyFarm();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/wallet/google/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ memberId, memberName, hooiBalance, tier, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { saveUrl?: string; error?: string };
      if (!mounted.current) return;
      if (res.ok && data.saveUrl?.startsWith(SAVE_PREFIX)) {
        setSaveUrl(data.saveUrl);
        setState("ready");
        return;
      }
      setSaveUrl(null);
      setState(data.error === "wallet_not_configured" ? "unavailable" : "error");
    } catch {
      if (!mounted.current) return;
      setSaveUrl(null);
      setState("error");
    }
  }, [memberId, memberName, hooiBalance, tier, locale]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  // Eén keer per bezoek een seintje wanneer je bij de boerderij aankomt.
  const announced = useRef(false);
  useEffect(() => {
    if (!nearby.isNear || announced.current) return;
    announced.current = true;
    toast.success(c.nearbyNow, { icon: <MapPin className="size-4" />, duration: 8000 });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Maximilien", { body: c.nearbyNow, tag: "maximilien-nearby" });
      } catch {
        /* sommige browsers staan dit enkel via een service worker toe */
      }
    }
  }, [nearby.isNear, c.nearbyNow]);

  const shortId = memberId.replace(/-/g, "").slice(0, 10).toUpperCase();

  return (
    <section className={`space-y-4 ${className}`} aria-label={c.title}>
      {/* De pas zelf */}
      <div
        className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] p-6 text-[color:var(--color-on-wallet-pass)] shadow-2xl transition-shadow ${
          nearby.isNear ? "ring-4 ring-[color:var(--color-terracotta)]/60" : ""
        }`}
        style={{
          background:
            "radial-gradient(120% 90% at 100% 0%, var(--color-wallet-pass-glow) 0%, var(--color-wallet-pass) 55%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[color:var(--color-terracotta)]/20 blur-3xl"
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-[color:var(--color-on-wallet-pass)]/15 font-display text-lg font-bold">
              M
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Maximilien</p>
              <p className="text-[11px] opacity-70">{c.title}</p>
            </div>
          </div>
          {nearby.isNear ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-terracotta)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--color-on-terracotta)]">
              <MapPin className="size-3" /> Nearby
            </span>
          ) : null}
        </div>

        <div className="relative mt-7">
          <p className="text-[11px] uppercase tracking-[0.18em] opacity-60">{c.member}</p>
          <p className="mt-1 truncate text-2xl font-semibold">{memberName}</p>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-60">{c.balance}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{hooiBalance}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-60">{c.tier}</p>
            <p className="mt-1 text-xl font-semibold">{tier || c.tierDefault}</p>
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-60">{c.number}</p>
            <p className="mt-1 font-mono text-sm tracking-wider">{shortId}</p>
          </div>
          <div className="rounded-2xl bg-[color:var(--color-cream)] p-2.5 shadow-inner">
            <QRCodeSVG value={`fermemaximilien:customer:${memberId}`} size={92} level="M" />
          </div>
        </div>
      </div>

      {/* Knop */}
      <div className="flex flex-col items-center gap-2">
        {state === "ready" && saveUrl ? (
          <a
            href={saveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={c.label}
            className="inline-block rounded-full transition-transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={googleAsset}
              onError={handleImageError}
              alt={c.label}
              className="h-12 w-auto"
              draggable={false}
            />
          </a>
        ) : state === "loading" ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" aria-busy="true">
            <Loader2 className="size-4 animate-spin" /> {c.loading}
          </p>
        ) : state === "error" ? (
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="size-4" /> {c.failed} {c.retry}
          </button>
        ) : (
          <p className="max-w-sm text-center text-xs text-muted-foreground">{c.notConfigured}</p>
        )}
        <p className="inline-flex max-w-sm items-start gap-1.5 text-center text-xs text-muted-foreground">
          <Smartphone className="mt-0.5 size-3.5 shrink-0" /> {c.apple}
        </p>
      </div>

      {/* Melding in de buurt */}
      {nearby.supported ? (
        <div className="mx-auto flex max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold">{c.nearbyTitle}</p>
            <p className="text-xs text-muted-foreground">
              {nearby.denied ? c.nearbyDenied : c.nearbyBody}
            </p>
            <p className="text-xs text-muted-foreground">{c.walletNote}</p>
          </div>
          <Switch
            checked={nearby.enabled}
            onCheckedChange={(on) => void nearby.setEnabled(on)}
            aria-label={c.nearbyTitle}
          />
        </div>
      ) : null}
    </section>
  );
}

export default GoogleWalletButton;
