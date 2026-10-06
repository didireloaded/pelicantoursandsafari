// Factual content sourced from Pelican's WIKINAM listing. Do not add invented facts.
const IMG_BASE =
  "https://www.wikinam.org/html/ctc/cl/tours-and-safaris-operators/264/windhoek-061/pelican-tours-and-safaris/img/showcase/1920/";
export const img = (n: string) => `${IMG_BASE}${n}.jpg`;

export const images = [
  "rhino", "leopard", "zebra", "oryx", "hippo", "hyena", "baboon", "sea-lions",
  "car-safari-scene", "nature-landscape", "savanna-plains-sunset", "quiver-tree-sunset",
];

export const company = {
  name: "Pelican Tours and Safaris",
  legal: "Pelican Tours and Safaris CC",
  intro:
    "Pelican Tours and Safaris CC is a proudly Namibian tour operator offering professionally guided travel experiences throughout Namibia, as well as selected routes into Botswana and Zimbabwe.",
  lead:
    "Led by Kamwi Kays, the company provides travellers with memorable adventures ranging from city tours to Big Five safaris and multi-day regional expeditions.",
  specialty:
    "We specialise in delivering reliable, well-planned, and experience-driven journeys tailored to the needs of both local and international travellers.",
  philosophy: "Every tour should be unique and tell a story. Each itinerary is designed not only as a trip, but as a complete travel experience.",
  values: ["Authenticity", "Personal connection", "High-quality guiding", "Attention to detail", "Creating long-lasting memories"],
  why: [
    "Professional and friendly service",
    "Knowledgeable guiding across Namibia and neighbouring countries",
    "Flexible and tailor-made itineraries",
    "Emphasis on Big Five and wildlife-rich adventures",
    "Reliable logistics and safe transport",
  ],
  serve: [
    "International tourists from Europe, the USA, South Africa and beyond",
    "Local Namibian travellers",
    "Families, couples, solo travellers and small groups",
    "Adventure seekers, wildlife lovers, photographers and cultural explorers",
  ],
  vehicles:
    "Tours operate using high-quality rental vehicles, ensuring safety and comfort while the business expands towards securing its own dedicated fleet.",
  contacts: [
    { name: "Kamwi Kays", display: "+264 81 761 8297", tel: "264817618297" },
    { name: "Fiona Kays", display: "+264 81 339 4533", tel: "264813394533" },
  ],
  email: "info@pelicantoursandsafaris.com",
  facebook: "https://www.facebook.com/100076147358304",
  album: "https://photos.app.goo.gl/1erfm9vzeVDA91QDA",
  address: ["10 Fabri Street", "Pionierspark", "Windhoek", "Namibia"],
  hours: "Monday – Friday, 8:00 – 17:00",
  payment: ["Cash", "EFT"],
};

export const whatsapp = (text?: string, tel = company.contacts[0].tel) =>
  `https://api.whatsapp.com/send?phone=${tel}${text ? `&text=${encodeURIComponent(text)}` : ""}`;

export type Destination = { slug: string; name: string; country: string; image: string; note?: string };
export const destinations: Destination[] = [
  { slug: "etosha", name: "Etosha National Park", country: "Namibia", image: "rhino", note: "Home to Pelican's Big Five safari experiences — lions, elephants, rhinos, leopards and buffalo in their natural habitat." },
  { slug: "sossusvlei-deadvlei", name: "Sossusvlei & Deadvlei", country: "Namibia", image: "nature-landscape" },
  { slug: "swakopmund-walvis-bay", name: "Swakopmund & Walvis Bay", country: "Namibia", image: "sea-lions" },
  { slug: "spitzkoppe", name: "Spitzkoppe", country: "Namibia", image: "quiver-tree-sunset" },
  { slug: "skeleton-coast", name: "Skeleton Coast", country: "Namibia", image: "hyena" },
  { slug: "kavango-zambezi", name: "Kavango & Zambezi Regions", country: "Namibia", image: "hippo" },
  { slug: "windhoek", name: "Windhoek", country: "Namibia", image: "car-safari-scene", note: "Namibia's capital and Pelican's home base." },
  { slug: "botswana", name: "Botswana", country: "Botswana", image: "zebra" },
  { slug: "chobe", name: "Chobe", country: "Botswana", image: "baboon" },
  { slug: "zimbabwe", name: "Zimbabwe", country: "Zimbabwe", image: "oryx" },
  { slug: "victoria-falls", name: "Victoria Falls", country: "Zimbabwe", image: "savanna-plains-sunset" },
];

export type Safari = {
  slug: string; name: string; short: string; overview: string; image: string; destinations: string[];
};
export const safaris: Safari[] = [
  {
    slug: "big-five-etosha", name: "Big Five Safari", image: "rhino", destinations: ["etosha"],
    short: "Lions, elephants, rhinos, leopards and buffalo in Etosha.",
    overview: "Safaris focused on Namibia's world-famous wildlife, especially within Etosha National Park, giving guests the opportunity to encounter lions, elephants, rhinos, leopards and buffalo in their natural habitat.",
  },
  {
    slug: "windhoek-city-tour", name: "Windhoek City Tour", image: "car-safari-scene", destinations: ["windhoek"],
    short: "History, culture and landmarks of the capital.",
    overview: "Explore Namibia's capital with a guided city tour highlighting history, culture, landmarks and local attractions — ideal for visitors wanting an authentic introduction to Windhoek.",
  },
  {
    slug: "namibian-highlights", name: "Namibian Highlights", image: "quiver-tree-sunset",
    destinations: ["etosha", "sossusvlei-deadvlei", "swakopmund-walvis-bay", "spitzkoppe", "skeleton-coast", "kavango-zambezi"],
    short: "Guided tours to all of Namibia's major destinations.",
    overview: "Guided tours to all major Namibian destinations, from Etosha and the dunes of Sossusvlei to the coast at Swakopmund and the Skeleton Coast.",
  },
  {
    slug: "cross-border", name: "Cross-Border Tours", image: "hippo",
    destinations: ["botswana", "chobe", "zimbabwe", "victoria-falls"],
    short: "Extend your journey into Botswana and Zimbabwe.",
    overview: "For travellers looking to extend their journey, Pelican offers trips into Botswana and Zimbabwe — including Chobe, Victoria Falls and other popular areas.",
  },
];

export const getSafari = (slug: string) => safaris.find((s) => s.slug === slug);
export const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);
export const safarisFor = (destSlug: string) => safaris.filter((s) => s.destinations.includes(destSlug));
