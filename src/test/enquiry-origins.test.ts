import { expect, it } from "vitest";
import { enquiryAllowedOrigins } from "@/lib/enquiry-origins";

it("allows this exact project preview while preserving configured production origins", () => {
  const origins = enquiryAllowedOrigins("https://pelicantoursandsafari.com, https://www.pelicantoursandsafari.com");
  expect(origins).toEqual([
    "https://pelicantoursandsafari.com",
    "https://www.pelicantoursandsafari.com",
    "https://id-preview--4f0c8ff3-e15d-4d3d-89c1-12398957d268.lovable.app",
  ]);
});

it("does not approve other projects, arbitrary sites or localhost", () => {
  const origins = enquiryAllowedOrigins(undefined);
  expect(origins).not.toContain("https://id-preview--other-project.lovable.app");
  expect(origins).not.toContain("https://attacker.example");
  expect(origins).not.toContain("http://localhost:8080");
});