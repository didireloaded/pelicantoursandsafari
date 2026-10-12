import { z } from "zod";
import { safaris } from "./pelican";
export const enquiryInput = z
  .object({
    request_id: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(255).nullable(),
    phone: z.string().trim().min(1).max(50).nullable(),
    residence: z.string().trim().max(120).nullable(),
    contact_preference: z.enum(["WhatsApp", "Email", "Phone"]),
    safari_slug: z
      .string()
      .refine((value) => safaris.some((s) => s.slug === value), "Invalid safari")
      .nullable(),
    brief: z.string().min(1).max(8000),
  })
  .strict()
  .refine((value) => !!(value.email || value.phone), "Provide email or phone.");
export type EnquiryInput = z.infer<typeof enquiryInput>;
export type EnquiryReceipt =
  { reference: string; error?: never } | { error: string; reference?: never };
