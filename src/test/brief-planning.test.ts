import { describe, expect, it } from "vitest";
import { validateBriefPlanning } from "@/lib/brief-planning";

const brief = { start: "", end: "", adults: "2", ages: [], days: "", budget: "" };
describe("Safari Brief planning validation", () => {
  it("allows dates, child ages, length and budget to be discussed", () => {
    expect(validateBriefPlanning({ ...brief, ages: [""] })).toBeNull();
  });
  it("accepts leap days, same-day dates and numeric boundary values", () => {
    expect(validateBriefPlanning({ ...brief, start: "2028-02-29", end: "2028-02-29", adults: "100", ages: ["0", "17"], days: "365", budget: "10000000" })).toBeNull();
  });
  it.each(["2027-02-29", "2028-04-31", "2028-13-01", "not-a-date"])("rejects the impossible date %s", (start) => {
    expect(validateBriefPlanning({ ...brief, start })?.step).toBe(1);
  });
  it("rejects departure before arrival even when dates are flexible", () => {
    expect(validateBriefPlanning({ ...brief, start: "2028-06-12", end: "2028-06-11" })?.message).toContain("on or after");
  });
  it.each(["", "0", "101", "1.5", "1e2", "-1"])("rejects invalid adults %s", (adults) => {
    expect(validateBriefPlanning({ ...brief, adults })?.step).toBe(1);
  });
  it.each(["-1", "18", "3.5"])("rejects invalid child age %s", (age) => {
    expect(validateBriefPlanning({ ...brief, ages: [age] })?.step).toBe(1);
  });
  it.each(["0", "366", "5.5"])("rejects invalid duration %s", (days) => {
    expect(validateBriefPlanning({ ...brief, days })?.step).toBe(1);
  });
  it.each(["0", "10000001", "100.5"])("rejects invalid budget %s", (budget) => {
    expect(validateBriefPlanning({ ...brief, budget })?.step).toBe(2);
  });
  it("validates every preceding step when jumping to review", () => {
    expect(validateBriefPlanning({ ...brief, adults: "0", budget: "0" }, 0)).toBeNull();
    expect(validateBriefPlanning({ ...brief, adults: "0", budget: "0" }, 2)?.step).toBe(1);
    expect(validateBriefPlanning({ ...brief, budget: "0" }, 1)).toBeNull();
    expect(validateBriefPlanning({ ...brief, budget: "0" }, 2)?.step).toBe(2);
  });
});
