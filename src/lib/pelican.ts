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

export const whatsapp = (text?: string, tel = company.contacts[0]?.tel ?? "") =>
  `https://api.whatsapp.com/send?phone=${tel}${text ? `&text=${encodeURIComponent(text)}` : ""}`;

export type Destination = { slug: string; name: string; country: string; image: string; note?: string };
export const destinations: Destination[] = [
  { slug: "etosha", name: "Etosha National Park", country: "Namibia", image: "rhino", note: "Explore Etosha's wildlife, including lions, elephants, rhinos and leopards. Sightings are never guaranteed." },
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
    slug: "big-five-etosha", name: "Etosha Wildlife Safari", image: "rhino", destinations: ["etosha"],
    short: "Explore Etosha's wildlife and waterholes.",
    overview: "Discover wildlife in Etosha National Park, with opportunities to observe lions, elephants, rhinos and leopards. Buffalo are not naturally present in Etosha, and wildlife sightings cannot be guaranteed.",
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

// Discovery labels describe the existing overview, not guaranteed package inclusions.
export const safariInterests: Record<string, string[]> = {
  "big-five-etosha": ["Wildlife"],
  "windhoek-city-tour": ["City", "Culture"],
  "namibian-highlights": ["Wildlife", "Desert", "Coast"],
  "cross-border": ["Wildlife", "Cross-border"],
};
export const planningInterests = ["Wildlife", "Desert", "Coast", "Culture", "Photography", "Adventure", "Family", "Landscape"];

export type Stay = { slug: string; name: string; destination: string; collection: string; type: "Lodge" | "Hotel" | "Resort"; description: string; amenities: string[]; source: string; verifiedAt: string; bookingMode: "request"; checkIn?: string; checkOut?: string };
export const stays: Stay[] = [
  { slug: "the-desert-grace", name: "The Desert Grace", destination: "sossusvlei-deadvlei", collection: "Gondwana Collection", type: "Lodge", description: "A Namib Desert lodge with twin, double and family bungalows, each with a private plunge pool.", amenities: ["Restaurant", "Bar", "Wi-Fi", "Private plunge pools"], checkIn: "14:00", checkOut: "10:00", source: "https://gondwana-collection.com/accommodation/desert-grace", verifiedAt: "2026-10-08", bookingMode: "request" },
  { slug: "mokuti-etosha", name: "Mokuti Etosha", destination: "etosha", collection: "O&L Leisure", type: "Lodge", description: "An Etosha-area lodge with gardens, a pool bar and a range of activities. Ask Pelican to confirm the room and activities for your dates.", amenities: ["Spa", "Tennis court", "Gym"], source: "https://trade.ol-leisure.com/mokuti-etosha", verifiedAt: "2026-10-08", bookingMode: "request" },
  { slug: "strand-hotel-swakopmund", name: "Strand Hotel Swakopmund", destination: "swakopmund-walvis-bay", collection: "O&L Leisure", type: "Hotel", description: "Beachside accommodation in Swakopmund with ocean views and several dining venues, providing a base for exploring the coast.", amenities: ["Brewer & Butcher", "Farmhouse Deli", "Ocean Cellar"], source: "https://trade.ol-leisure.com/strand-hotel-swakopmund", verifiedAt: "2026-10-08", bookingMode: "request" },
  { slug: "okaukuejo-resort", name: "Okaukuejo Resort", destination: "etosha", collection: "Namibia Wildlife Resorts", type: "Resort", description: "An Etosha resort known for its floodlit waterhole, where visitors can watch wildlife during the day and at night. NWR currently directs booking requests to its reservations team.", amenities: ["Floodlit waterhole", "Camping", "Guided drives available on request"], source: "https://www.nwr.com.na/resorts/okaukuejo-resort/", verifiedAt: "2026-10-08", bookingMode: "request" },
];
export const getStay = (slug: string) => stays.find((stay) => stay.slug === slug);
