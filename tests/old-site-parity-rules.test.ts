import { describe, expect, it } from "vitest";
import { invitationTotalCents } from "@/lib/invitation";
import { CV_MAX_BYTES } from "@/lib/internships";

describe("printed invitation pricing", () => {
  it("charges €1 per card when collected at the farm", () => {
    expect(invitationTotalCents(12, "pickup")).toBe(1200);
  });
  it("adds €4.50 for postal delivery", () => {
    expect(invitationTotalCents(12, "post")).toBe(1650);
  });
  it("rejects quantities outside the offered packs", () => {
    expect(invitationTotalCents(7, "pickup")).toBeNull();
  });
});

describe("internship application", () => {
  it("accepts CVs up to 5 MB", () => {
    expect(CV_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
