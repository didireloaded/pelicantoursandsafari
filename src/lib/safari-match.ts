import { safariInterests, safaris } from "./pelican";
export const matchInterests = [...new Set(Object.values(safariInterests).flat())];
export function matchSafaris(interests: string[]) {
  const valid = [...new Set(interests.filter((x) => matchInterests.includes(x)))];
  return safaris
    .map((safari) => ({
      safari,
      matched: (safariInterests[safari.slug] ?? []).filter((x) => valid.includes(x)),
    }))
    .filter((x) => !valid.length || x.matched.length)
    .sort((a, b) => b.matched.length - a.matched.length);
}
