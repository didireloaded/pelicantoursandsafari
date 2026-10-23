import { describe, expect, it } from "vitest";
import { paymentStatus } from "@/components/admin/payments";
import { adminLinks } from "@/lib/admin-navigation";

describe("admin workflow wiring", () => {
  it("uses the plain Quotes label", () => {
    expect(adminLinks.find((link) => link.to === "/proposals")?.label).toBe("Quotes");
  });

  it("keeps confirmed trip management in Reservations", () => {
    expect(adminLinks.find((link) => link.to === "/admin/bookings")?.label).toBe("Reservations");
    expect(adminLinks.map((link) => String(link.to))).not.toContain("/trips-manage");
  });

  it.each([
    [null, null, "Needs amounts"],
    [1000, null, "Needs amounts"],
    [1000, 0, "Outstanding"],
    [1000, 400, "Part-paid"],
    [1000, 1000, "Paid"],
  ] as const)("derives payment status from recorded totals", (total, paid, status) => {
    expect(paymentStatus(total, paid)).toBe(status);
  });
});
