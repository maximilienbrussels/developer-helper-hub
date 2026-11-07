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

import { isValidWaitlistDate, waitlistDateError, waitlistChildrenError } from "@/lib/birthday-waitlist";

describe("birthday waiting list dates", () => {
  it("rejects impossible dates even if JavaScript rolls them onto a Wednesday", () => {
    expect(isValidWaitlistDate("2026-02-32", "woensdag", "2026-01-01")).toBe(false);
    expect(isValidWaitlistDate("2026-13-06", "woensdag", "2026-01-01")).toBe(false);
  });
  it("limits Wednesday party requests to the published 18 children", () => {
    const base = { firstName: "a", lastName: "b", phone: "0470000000", email: "a@b.be", packageSlug: "woensdag", lang: "nl" as const, date: "2026-11-11", alternatives: [] };
    expect(waitlistChildrenError({ ...base, children: 18 })).toBe(false);
    expect(waitlistChildrenError({ ...base, children: 19 })).toBe(true);
  });
  it("limits family party requests to the published 40 guests", () => {
    const base = { firstName: "a", lastName: "b", phone: "0470000000", email: "a@b.be", packageSlug: "familiefeest", lang: "nl" as const, date: "2026-11-14", alternatives: [] };
    expect(waitlistChildrenError({ ...base, children: 40 })).toBe(false);
    expect(waitlistChildrenError({ ...base, children: 41 })).toBe(true);
  });
  // 2026-11-11 is a Wednesday, 2026-11-14 a Saturday, 2026-11-12 a Thursday.
  it("accepts only Wednesday for the Wednesday party", () => {
    expect(isValidWaitlistDate("2026-11-11", "woensdag", "2026-11-06")).toBe(true);
    expect(isValidWaitlistDate("2026-11-14", "woensdag", "2026-11-06")).toBe(false);
  });
  it("accepts only Saturday for Saturday packages", () => {
    expect(isValidWaitlistDate("2026-11-14", "zaterdag-halve-dag", "2026-11-06")).toBe(true);
    expect(isValidWaitlistDate("2026-11-12", "familiefeest", "2026-11-06")).toBe(false);
  });
  it("rejects past dates and duplicate alternatives", () => {
    expect(isValidWaitlistDate("2026-11-04", "woensdag", "2026-11-06")).toBe(false);
    const base = { firstName: "a", lastName: "b", phone: "0470000000", email: "a@b.be", packageSlug: "woensdag", lang: "nl" as const };
    expect(waitlistDateError({ ...base, date: "2026-11-11", alternatives: ["2026-11-11"] }, "2026-11-06")).toBe("alternatives");
    expect(waitlistDateError({ ...base, date: "2026-11-11", alternatives: ["2026-11-18"] }, "2026-11-06")).toBeNull();
  });
});
