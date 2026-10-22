/** Exact project preview only; no wildcard or arbitrary request-origin approval. */
const projectPreviewOrigin = "https://id-preview--4f0c8ff3-e15d-4d3d-89c1-12398957d268.lovable.app";

export function enquiryAllowedOrigins(configured: string | undefined): string[] {
  return [...new Set([
    ...(configured ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
    projectPreviewOrigin,
  ])];
}