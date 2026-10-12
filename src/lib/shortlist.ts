import { getSafari, stays } from "./pelican";
export type SavedChoice = { kind: "safari" | "stay"; slug: string };
export function parseShortlist(value: unknown): SavedChoice[] {
  if (typeof value === "string" && value.length > 4000) return [];
  try {
    const values: unknown = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(values)) return [];
    const result: SavedChoice[] = [];
    for (const item of values.slice(0, 30)) {
      if (!item || typeof item !== "object") continue;
      const { kind, slug } = item;
      if (
        typeof slug !== "string" ||
        !(
          (kind === "safari" && getSafari(slug)) ||
          (kind === "stay" && stays.some((s) => s.slug === slug))
        )
      )
        continue;
      if (!result.some((x) => x.kind === kind && x.slug === slug)) result.push({ kind, slug });
    }
    return result;
  } catch {
    return [];
  }
}
export function readShortlist() {
  try {
    return parseShortlist(localStorage.getItem("pelican-shortlist"));
  } catch {
    return [];
  }
}
export function writeShortlist(items: SavedChoice[]) {
  localStorage.setItem("pelican-shortlist", JSON.stringify(parseShortlist(JSON.stringify(items))));
}
