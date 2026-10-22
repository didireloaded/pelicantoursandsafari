// Factual content sourced from Pelican's WIKINAM listing. Do not add invented facts.
// Local derivatives of the same source photographs; source evidence is in
// public/images/manifest.json. No image crop or catalogue fact is changed.
export const img = (name: string, width: 640 | 1280 | 1920 = 1920) =>
  `/images/${name}-${width}.webp`;
export const imageSrcSet = (name: string, format: "webp" | "avif" = "webp") =>
  [640, 1280, 1920].map((width) => `/images/${name}-${width}.${format} ${width}w`).join(", ");
export const imageDimensions: Record<string, { width: number; height: number }> = {
  rhino: { width: 1920, height: 1280 },
  leopard: { width: 1920, height: 1285 },
  zebra: { width: 1920, height: 1280 },
  oryx: { width: 1920, height: 1280 },
  hippo: { width: 1920, height: 1281 },
  hyena: { width: 1920, height: 1280 },
  baboon: { width: 1920, height: 1281 },
  "sea-lions": { width: 1920, height: 1280 },
  "car-safari-scene": { width: 1920, height: 1280 },
  "nature-landscape": { width: 1920, height: 1280 },
  "savanna-plains-sunset": { width: 1920, height: 1282 },
  "quiver-tree-sunset": { width: 1920, height: 1281 },
};

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

// General planning guidance checked against these official sources on 12 October 2026.
export const travelGuidance = {
  checked: "12 October 2026",
  pricing:
    "Your quote depends on travel dates, group size, accommodation, trip length, transport and requested activities. Ask for a written total, currency, inclusions, exclusions and payment/cancellation terms before committing. Catalogue suggestions do not have verified starting prices.",
  // Namibia Tourism Board climate page, checked 12 October 2026.
  // Seasonal patterns are guidance, never a forecast or availability signal.
  calendar: {
    source: "https://visitnamibia.com.na/climate/",
    checked: "12 October 2026",
    summerMonths: [10, 11, 12, 1, 2, 3, 4],
    winterMonths: [5, 6, 7, 8, 9],
    shortRainMonths: [9, 10, 11],
    mainRainMonths: [12, 1, 2, 3, 4],
    summer: "Summer conditions: inland days can be very hot. Plan activities, water and sun protection around the heat.",
    winter: "Winter conditions: days are generally pleasant, but nights can be very cold. Pack warm layers for early starts and evenings.",
    shortRain: "The tourism authority places the short rainy season in September–November. Rainfall and local conditions vary; check your route before travel.",
    mainRain: "The tourism authority places the main rainy season in December–April. Rainfall varies; ask Pelican about current road access and your planned activities.",
    outsideRain: "This month is outside the authority’s listed rainy-season windows. This is a general pattern, not a promise of dry weather.",
    coast: "Coastal conditions differ from the interior: cooler weather and fog are common. Bring warm layers in any month.",
    wildlife: "Ask Pelican how recent rainfall and water conditions affect wildlife viewing for your dates. Sightings are never guaranteed.",
  },
  seasons: [
    {
      title: "Etosha and northern Namibia",
      body: "Summer is hot and rainy; winter brings cooler days and cold nights. Ask Pelican how recent rainfall and water conditions affect wildlife viewing for your dates. Sightings are never guaranteed.",
      source: "https://visitnamibia.com.na/climate/",
    },
    {
      title: "Sossusvlei, Deadvlei and the Namib",
      body: "Winter can offer warm days with very cold nights. Summer can be extremely hot: plan activities and packing around the heat.",
      source: "https://visitnamibia.com.na/climate/",
    },
    {
      title: "Swakopmund, Walvis Bay and the Skeleton Coast",
      body: "The coast is cooler than the interior and fog is common. Bring warm layers even when travelling in summer.",
      source: "https://visitnamibia.com.na/climate/",
    },
    {
      title: "Botswana, Chobe and Victoria Falls",
      body: "Choose dates around your interests and check regional conditions before confirming. Rainfall, river levels and wildlife viewing vary; Pelican can explain the trade-offs for your route.",
      source: "https://botswanatourism.co.bw/travel-info",
    },
  ],
  faq: [
    {
      title: "Where is Pelican Tours and Safaris based?",
      body: `${company.legal} is based at ${company.address.join(", ")}. Office hours are ${company.hours}.`,
      source: "https://pelicantoursandsafari.com/contact",
    },
    {
      title: "Which countries does Pelican offer tours in?",
      body: company.intro,
      source: "https://pelicantoursandsafari.com/about",
    },
    {
      title: "How do I request a tailor-made safari?",
      body: "Use the Safari Brief to share your destinations, dates, interests, budget and contact details. Pelican will discuss your preferences and prepare a proposal. Sending an enquiry does not confirm a booking; availability, price and written terms must be agreed with Pelican.",
      source: "https://pelicantoursandsafari.com/tailor-made",
    },
    {
      title: "Do I need a visa or border documents?",
      body: "Rules depend on passport, destination, route and travel dates. Check every country on your itinerary with its immigration authority, including requirements for children. UK travel advice is written for British passport holders; other nationalities should consult their own embassy.",
      source: "https://www.gov.uk/foreign-travel-advice/namibia/entry-requirements",
    },
    {
      title: "What vaccinations or health precautions do I need?",
      body: "Speak to a travel-health professional about your route, medical history, vaccines and malaria precautions before travelling. Requirements and risk vary by area and season.",
      source: "https://www.gov.uk/foreign-travel-advice/namibia/health",
    },
    {
      title: "What insurance should I arrange?",
      body: "Check that your policy covers your planned activities, medical treatment, evacuation and cancellation. Review exclusions and assistance contacts before departure.",
      source: "https://www.gov.uk/foreign-travel-advice/namibia",
    },
    {
      title: "What about roads and driving?",
      body: "Review current driving advice and confirm vehicle suitability with Pelican. Allow time for road conditions and stops; a map estimate is not a guaranteed arrival time.",
      source: "https://www.gov.uk/foreign-travel-advice/namibia/safety-and-security",
    },
    {
      title: "How should I handle currency?",
      body: "Request a quote with the currency clearly stated. Confirm card acceptance and cash needs for your route before departure.",
      source: "https://visitnamibia.com.na/currencies/",
    },
    {
      title: "What luggage can I bring?",
      body: "Ask Pelican for the limits of your actual vehicle, accommodation and any flight connections. Pack layers for your route and season; do not assume every operator uses the same allowance.",
      source: "https://visitnamibia.com.na/climate/",
    },
    {
      title: "What are the cancellation terms?",
      body: "Ask for the written terms attached to your proposal before paying. Refunds, deadlines and supplier conditions must be confirmed for your own booking.",
      source: "https://www.gov.uk/foreign-travel-advice/namibia",
    },
  ],
};
