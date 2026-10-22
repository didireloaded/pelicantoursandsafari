// Deployment snapshot of pelican.ts. Parity is enforced by ai-provider-wiring.test.ts.
export const destinations = [
  { slug: "etosha", name: "Etosha National Park" },
  { slug: "sossusvlei-deadvlei", name: "Sossusvlei & Deadvlei" },
  { slug: "swakopmund-walvis-bay", name: "Swakopmund & Walvis Bay" },
  { slug: "spitzkoppe", name: "Spitzkoppe" },
  { slug: "skeleton-coast", name: "Skeleton Coast" },
  { slug: "kavango-zambezi", name: "Kavango & Zambezi Regions" },
  { slug: "windhoek", name: "Windhoek" },
  { slug: "botswana", name: "Botswana" },
  { slug: "chobe", name: "Chobe" },
  { slug: "zimbabwe", name: "Zimbabwe" },
  { slug: "victoria-falls", name: "Victoria Falls" },
];
export const safaris = [
  {
    slug: "big-five-etosha", name: "Etosha Wildlife Safari", destinations: ["etosha"],
    overview: "Discover wildlife in Etosha National Park, with opportunities to observe lions, elephants, rhinos and leopards. Buffalo are not naturally present in Etosha, and wildlife sightings cannot be guaranteed.",
  },
  {
    slug: "windhoek-city-tour", name: "Windhoek City Tour", destinations: ["windhoek"],
    overview: "Explore Namibia's capital with a guided city tour highlighting history, culture, landmarks and local attractions — ideal for visitors wanting an authentic introduction to Windhoek.",
  },
  {
    slug: "namibian-highlights", name: "Namibian Highlights",
    destinations: ["etosha", "sossusvlei-deadvlei", "swakopmund-walvis-bay", "spitzkoppe", "skeleton-coast", "kavango-zambezi"],
    overview: "Guided tours to all major Namibian destinations, from Etosha and the dunes of Sossusvlei to the coast at Swakopmund and the Skeleton Coast.",
  },
  {
    slug: "cross-border", name: "Cross-Border Tours", destinations: ["botswana", "chobe", "zimbabwe", "victoria-falls"],
    overview: "For travellers looking to extend their journey, Pelican offers trips into Botswana and Zimbabwe — including Chobe, Victoria Falls and other popular areas.",
  },
];
export const safariInterests: Record<string, string[]> = {
  "big-five-etosha": ["Wildlife"],
  "windhoek-city-tour": ["City", "Culture"],
  "namibian-highlights": ["Wildlife", "Desert", "Coast"],
  "cross-border": ["Wildlife", "Cross-border"],
};