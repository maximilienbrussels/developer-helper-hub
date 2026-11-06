import { useCallback, useEffect, useState } from "react";

/** Boerderij-coördinaten (zelfde als in de Google Wallet-pas). */
export const FARM_LOCATION = { latitude: 50.85885, longitude: 4.350356 };
/** Straal waarbinnen we "in de buurt" melden. */
export const NEARBY_RADIUS_M = 250;
const STORAGE_KEY = "maximilien:nearby-alert";

/** Afstand in meter tussen twee punten (haversine). */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Opt-in locatiewacht: enkel in de browser, niets wordt verstuurd. */
export function useNearbyFarm() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [denied, setDenied] = useState(false);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "geolocation" in navigator);
    setEnabledState(window.localStorage.getItem(STORAGE_KEY) === "on");
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setDenied(false);
        setIsNear(distanceMeters(pos.coords, FARM_LOCATION) <= NEARBY_RADIUS_M);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setDenied(true);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, supported]);

  const setEnabled = useCallback(async (on: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    setEnabledState(on);
    if (!on) setIsNear(false);
    if (on && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  return { supported, enabled, denied, isNear, setEnabled };
}
