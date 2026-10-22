import { z } from "zod";
import { destinations, images, planningInterests } from "./pelican";
import { safariPackageSchema, emptySafariPackage } from "./safari-package";

export const contentKinds = ["package", "photo"] as const;
const destination = z
  .string()
  .refine(
    (value) => destinations.some((place) => place.slug === value),
    "Choose an existing destination.",
  );
export const mediaPath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/);
export const packageContentSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(400),
    description: z.string().trim().min(1).max(12000),
    destinations: z.array(destination).min(1).max(11),
    interests: z.array(z.string().refine((value) => planningInterests.includes(value))).max(20),
    image: z.string().refine((value) => images.includes(value)),
    coverPath: mediaPath.nullable(),
    coverAlt: z.string().trim().max(300),
    details: safariPackageSchema,
  })
  .strict()
  .refine((value) => !value.coverPath || !!value.coverAlt, "Describe the cover photograph.");
export const photoContentSchema = z
  .object({
    destination,
    path: mediaPath,
    alt: z.string().trim().min(1).max(300),
    caption: z.string().trim().max(600),
    position: z.number().int().min(0).max(9999),
  })
  .strict();
export type PackageContent = z.infer<typeof packageContentSchema>;
export type PhotoContent = z.infer<typeof photoContentSchema>;
export type ContentData = PackageContent | PhotoContent;
export type ContentKind = (typeof contentKinds)[number];
export type ContentRow = {
  id: string;
  kind: ContentKind;
  draft: ContentData;
  published: ContentData | null;
  revision: number;
  updated_at: string;
};
export type PublishedContent = {
  id: string;
  kind: ContentKind;
  data: ContentData;
  updated_at: string;
};
export function parseContent(kind: ContentKind, value: unknown): ContentData {
  if (kind === "package" && value && typeof value === "object" && "details" in value) {
    const details = value.details;
    if (details && typeof details === "object") {
      const normalized = { ...details } as Record<string, unknown>;
      for (const field of ["inclusions", "exclusions"]) {
        if (Array.isArray(normalized[field]))
          normalized[field] = normalized[field].filter(
            (item) => typeof item !== "string" || item.trim(),
          );
      }
      return packageContentSchema.parse({ ...value, details: normalized });
    }
  }
  return kind === "package" ? packageContentSchema.parse(value) : photoContentSchema.parse(value);
}
export function readPublishedContent(value: unknown): PublishedContent[] {
  if (!Array.isArray(value)) throw new Error("Content unavailable.");
  return value.map((row) => ({ ...row, data: parseContent(row.kind, row.data) }));
}
export const blankPackage = (): PackageContent => ({
  title: "",
  summary: "",
  description: "",
  destinations: [],
  interests: [],
  image: "rhino",
  coverPath: null,
  coverAlt: "",
  details: emptySafariPackage(),
});
