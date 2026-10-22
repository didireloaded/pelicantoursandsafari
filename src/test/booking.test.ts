import { describe, expect, it } from "vitest";
import {
  bookableTrips,
  bookingRefPattern,
  bookingStage,
  bookingToEnquiry,
  tripCodeFor,
  TAILOR_MADE_CODE,
} from "@/lib/booking";
import { enquiryInput } from "@/lib/enquiry-input";

describe("booking codes", () => {
  it("Etosha Wildlife Safari uses trip code ENP1", () =>
    expect(tripCodeFor("big-five-etosha")).toBe("ENP1"));
  it("every trip code is unique", () => {
    const codes = bookableTrips.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it("tailor-made uses TMS1", () => expect(TAILOR_MADE_CODE).toBe("TMS1"));
  it("references are the trip code plus 4 characters", () => {
    expect(bookingRefPattern.test("ENP1-7K3Q")).toBe(true);
    expect(bookingRefPattern.test("ENP1-7K3")).toBe(false);
    expect(bookingRefPattern.test("ENP1-OOOO")).toBe(false);
  });
  it("maps statuses to traveller stages", () => {
    expect(bookingStage("new")).toBe("Received");
    expect(bookingStage("contacted")).toBe("Under review");
    expect(bookingStage("quote_sent")).toBe("Under review");
    expect(bookingStage("confirmed")).toBe("Confirmed");
    expect(bookingStage("closed")).toBe("Closed");
  });
  it("booking requests become valid enquiries", () => {
    const e = bookingToEnquiry({
      request_id: crypto.randomUUID(),
      trip_code: "ENP1",
      name: "A",
      email: "a@b.co",
      phone: null,
      contact_preference: "Email",
      dates: "June",
      travellers: 2,
      notes: "",
    });
    expect(e.safari_slug).toBe("big-five-etosha");
    expect(enquiryInput.safeParse(e).success).toBe(true);
  });
});
