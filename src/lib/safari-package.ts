import { z } from "zod";
import { getSafari } from "@/lib/pelican";

const text = z.string().trim().min(1).max(1200);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Use a valid date.");
const https = z
  .string()
  .url()
  .max(1999)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  });
export const safariPackageSchema = z
  .object({
    durationDays: z.number().int().min(1).max(90).nullable(),
    days: z
      .array(
        z
          .object({
            activities: text,
            overnight: z.string().trim().max(300),
            transfer: z.string().trim().max(600),
          })
          .strict(),
      )
      .max(90),
    inclusions: z.array(text).max(30),
    exclusions: z.array(text).max(30),
    rates: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(120),
            startsOn: date,
            endsOn: date,
            amountNad: z.number().finite().positive().max(10000000),
            roomNotes: z.string().trim().max(600),
          })
          .strict()
          .refine((rate) => rate.endsOn >= rate.startsOn, "Rate end must follow start."),
      )
      .max(24),
    conversions: z
      .array(
        z
          .object({
            currency: z.enum(["USD", "EUR"]),
            perNad: z.number().finite().positive().max(10),
            checkedOn: date,
            sourceUrl: https,
          })
          .strict(),
      )
      .max(2)
      .refine(
        (rates) => new Set(rates.map((rate) => rate.currency)).size === rates.length,
        "Use one rate for each currency.",
      ),
  })
  .strict()
  .refine(
    (details) => !details.days.length || details.durationDays === details.days.length,
    "Duration must match the day-by-day itinerary.",
  );
export type SafariPackage = z.infer<typeof safariPackageSchema>;
export const emptySafariPackage = (): SafariPackage => ({
  durationDays: null,
  days: [],
  inclusions: [],
  exclusions: [],
  rates: [],
  conversions: [],
});
export type ApprovedSafariPackage = {
  details: SafariPackage;
  sourceUrl: string;
  updatedAt: string;
};

// Validate database JSON at its public consumption boundary; unpublished rows never become facts.
export function readApprovedPackages(
  rows: {
    approved: boolean;
    safari_slug: string | null;
    package_details: unknown;
    source_url: string;
    updated_at: string;
  }[],
): Record<string, ApprovedSafariPackage> {
  const result: Record<string, ApprovedSafariPackage> = {};
  for (const row of [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at))) {
    if (!row.approved || !row.safari_slug || !getSafari(row.safari_slug) || result[row.safari_slug])
      continue;
    const parsed = safariPackageSchema.safeParse(row.package_details);
    if (parsed.success && https.safeParse(row.source_url).success)
      result[row.safari_slug] = {
        details: parsed.data,
        sourceUrl: row.source_url,
        updatedAt: row.updated_at,
      };
  }
  return result;
}
export const todayUtc = () => new Date().toISOString().slice(0, 10);
export function startingRate(details: SafariPackage, today = todayUtc()) {
  return details.rates
    .filter((rate) => rate.endsOn >= today)
    .sort((a, b) => a.amountNad - b.amountNad)[0];
}
export function activeConversions(details: SafariPackage, today = todayUtc()) {
  const now = new Date(`${today}T00:00:00Z`).getTime();
  return details.conversions.filter((rate) => {
    const age = now - new Date(`${rate.checkedOn}T00:00:00Z`).getTime();
    return age >= 0 && age <= 7 * 86400000;
  });
}
export function formatNad(amount: number) {
  return `NAD ${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(amount)}`;
}
export function displayPackageAmount(
  amount: number,
  currency: string,
  details: SafariPackage,
  today = todayUtc(),
) {
  const conversion = activeConversions(details, today).find((rate) => rate.currency === currency);
  return conversion
    ? new Intl.NumberFormat("en", { style: "currency", currency: conversion.currency }).format(
        amount * conversion.perNad,
      )
    : formatNad(amount);
}
