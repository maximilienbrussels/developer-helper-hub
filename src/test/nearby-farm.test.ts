import { describe, expect, it } from "vitest";
import { distanceMeters, FARM_LOCATION, NEARBY_RADIUS_M } from "@/lib/use-nearby-farm";

describe("nearby farm", () => {
  it("counts a spot ~100 m away as nearby", () => {
    const d = distanceMeters(FARM_LOCATION, { latitude: 50.8597, longitude: 4.350356 });
    expect(d).toBeLessThan(NEARBY_RADIUS_M);
  });
  it("does not count Brussels-South (~2 km) as nearby", () => {
    const d = distanceMeters(FARM_LOCATION, { latitude: 50.8357, longitude: 4.3363 });
    expect(d).toBeGreaterThan(NEARBY_RADIUS_M);
  });
});
