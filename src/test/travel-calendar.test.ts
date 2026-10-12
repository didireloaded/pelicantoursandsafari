import { describe, expect, it } from "vitest";
import { calendarGuidance } from "@/lib/travel-calendar";
import { destinations, travelGuidance } from "@/lib/pelican";

describe("Source-backed travel calendar", () => {
  it("keeps the September rain/winter and October rain/summer overlaps", () => {
    expect(calendarGuidance("etosha", 9)?.notes).toContain(travelGuidance.calendar.winter);
    expect(calendarGuidance("etosha", 9)?.notes).toContain(travelGuidance.calendar.shortRain);
    expect(calendarGuidance("etosha", 10)?.notes).toContain(travelGuidance.calendar.summer);
    expect(calendarGuidance("etosha", 10)?.notes).toContain(travelGuidance.calendar.shortRain);
    expect(calendarGuidance("etosha", 12)?.notes).toContain(travelGuidance.calendar.mainRain);
    expect(calendarGuidance("etosha", 5)?.notes).toContain(travelGuidance.calendar.outsideRain);
  });
  it("uses coastal guidance instead of inland heat and rainfall claims", () => {
    for (const slug of ["swakopmund-walvis-bay", "skeleton-coast"]) {
      expect(calendarGuidance(slug, 1)?.notes).toEqual([travelGuidance.calendar.coast]);
    }
  });
  it("never applies Namibia month ranges to Botswana or Zimbabwe", () => {
    for (const slug of ["botswana", "chobe", "zimbabwe", "victoria-falls"]) {
      const guidance = calendarGuidance(slug, 1)!;
      expect(guidance.notes).not.toContain(travelGuidance.calendar.summer);
      expect(guidance.notes.join(" ")).toContain("need confirmation");
    }
  });
  it("supports every catalogue destination/month and rejects invalid input", () => {
    for (const destination of destinations)
      for (let month = 1; month <= 12; month++)
        expect(calendarGuidance(destination.slug, month)?.source).toMatch(/^https:/);
    for (const month of [0, 13, 1.5, NaN])
      expect(calendarGuidance("etosha", month)).toBeUndefined();
    expect(calendarGuidance("invented-destination", 1)).toBeUndefined();
  });
});
