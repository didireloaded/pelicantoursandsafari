import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Sun, Mail, MapPin, Clock, MessageCircle, Facebook, ChevronDown, Check } from "lucide-react";

const IMG = "https://www.wikinam.org/html/ctc/cl/tours-and-safaris-operators/264/windhoek-061/pelican-tours-and-safaris/img/showcase/1920/";
const img = (n: string) => IMG + n + ".jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pelican Tours and Safaris — Namibian Safari & Tour Operator" },
      { name: "description", content: "Big Five safaris in Etosha, Windhoek city tours, Sossusvlei, Skeleton Coast and cross-border trips to Botswana and Zimbabwe." },
      { property: "og:title", content: "Pelican Tours and Safaris — Discover Namibia" },
      { property: "og:description", content: "Proudly Namibian, professionally guided safaris and tours led by Kamwi Kays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: img("savanna-plains-sunset") },
      { name: "twitter:image", content: img("savanna-plains-sunset") },
    ],
  }),
  component: Index,
});

const services = [
  { t: "Big Five Safaris", d: "Encounter lions, elephants, rhinos, leopards and buffalo in Etosha National Park.", i: "rhino" },
  { t: "Windhoek City Tours", d: "History, culture, landmarks and local attractions — an authentic introduction to the capital.", i: "car-safari-scene" },
  { t: "Namibian Highlights", d: "Guided tours to every major destination, from desert dunes to the wild coastline.", i: "quiver-tree-sunset" },
  { t: "Cross-Border Tours", d: "Extend your journey into Botswana and Zimbabwe — Chobe, Victoria Falls and more.", i: "hippo" },
];
const destinations = ["Etosha National Park", "Sossusvlei & Deadvlei", "Swakopmund & Walvis Bay", "Spitzkoppe", "Skeleton Coast", "Kavango & Zambezi Regions"];
const philosophy = ["Authenticity", "Personal connection", "High-quality guiding", "Attention to detail", "Creating long-lasting memories"];
const why = ["Professional and friendly service", "Knowledgeable guiding across Namibia and neighbouring countries", "Flexible and tailor-made itineraries", "Emphasis on Big Five and wildlife-rich adventures", "Reliable logistics and safe transport", "Backed by Namibia's leading online presence (WIKINAM.ORG)"];
const serve = ["International tourists", "Local Namibian travellers", "Families & couples", "Solo travellers & small groups", "Wildlife lovers & photographers", "Cultural explorers"];
const gallery = ["leopard", "zebra", "oryx", "sea-lions", "baboon", "hyena", "nature-landscape", "savanna-plains-sunset"];

function Pill({ src, className = "" }: { src: string; className?: string }) {
  return <img src={img(src)} alt="" className={`h-16 object-cover md:h-24 lg:h-28 ${className}`} />;
}

function Index() {
  const [loc, setLoc] = useState("Etosha");
  const [people, setPeople] = useState("2 people");
  const [date, setDate] = useState("");
  const waText = encodeURIComponent(`Hello Pelican Tours, I'd like to plan a trip to ${loc} for ${people}${date ? " on " + date : ""}.`);

  return (
    <div className="min-h-screen bg-sand/90 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8">
        {/* Hero card */}
        <section className="rounded-3xl bg-background px-5 py-6 shadow-2xl md:px-12 md:py-10">
          <nav className="flex items-center justify-between gap-4 text-sm font-medium">
            <div className="hidden gap-10 md:flex">
              <a href="#tours">Tours</a><a href="#destinations">Destinations</a><a href="#about">About</a><a href="#gallery">Gallery</a>
            </div>
            <a href="#" className="flex items-center gap-2 font-semibold"><Sun className="h-5 w-5 text-clay" />Pelican Tours</a>
            <div className="flex items-center gap-5">
              <span className="hidden items-center gap-1 lg:flex">Windhoek <Sun className="h-4 w-4 text-clay" /><span className="text-clay">Namibia</span></span>
              <a href="#contact" className="hidden sm:inline">Contact us</a>
              <a href="tel:+264817618297" aria-label="Call" className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></a>
            </div>
          </nav>

          <h1 className="mt-12 text-[13vw] font-bold leading-[1.05] tracking-tight md:mt-16 md:text-7xl lg:text-8xl">
            <div className="flex items-center gap-4">
              <span>Discover <span className="text-clay">Namibia</span></span>
              <Pill src="rhino" className="hidden flex-1 rounded-l-2xl rounded-r-[4rem] md:block" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Pill src="zebra" className="hidden flex-1 rounded-r-[4rem] rounded-l-[3rem] md:block" />
              <span>safari</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-clay">tour</span>
              <Pill src="leopard" className="hidden flex-1 rounded-l-[4rem] rounded-r-[4rem] md:block" />
              <span>story</span>
            </div>
          </h1>

          <p className="mt-14 text-center font-medium">Plan Your Namibian Wildlife Journey</p>
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-card p-3 shadow-lg md:flex-row md:items-center md:gap-0 md:pl-6">
            <label className="flex flex-1 items-center justify-between gap-3 text-sm md:border-r md:pr-5">
              <span className="text-muted-foreground">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent font-semibold outline-none" />
            </label>
            <label className="relative flex flex-1 items-center justify-between gap-3 text-sm md:border-r md:px-5">
              <span className="text-muted-foreground">Location</span>
              <select value={loc} onChange={(e) => setLoc(e.target.value)} className="appearance-none bg-transparent pr-5 text-right font-semibold outline-none">
                {["Etosha", "Sossusvlei", "Swakopmund", "Skeleton Coast", "Windhoek", "Botswana", "Zimbabwe"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-primary md:right-5" />
            </label>
            <label className="relative flex flex-1 items-center justify-between gap-3 text-sm md:px-5">
              <span className="text-muted-foreground">Participants</span>
              <select value={people} onChange={(e) => setPeople(e.target.value)} className="appearance-none bg-transparent pr-5 text-right font-semibold outline-none">
                {["1 person", "2 people", "3–4 people", "5+ people"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-primary md:right-5" />
            </label>
            <a href={`https://api.whatsapp.com/send?phone=264817618297&text=${waText}`} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-7 py-4 text-center text-sm font-semibold text-primary-foreground">Start your journey</a>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {/* About */}
          <section id="about" className="grid gap-8 rounded-3xl bg-background p-6 md:grid-cols-2 md:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-clay">Proudly Namibian</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Every tour should tell a story.</h2>
              <p className="mt-6 leading-relaxed text-muted-foreground">Pelican Tours and Safaris CC offers professionally guided travel throughout Namibia, with selected routes into Botswana and Zimbabwe. Led by <strong className="text-foreground">Kamwi Kays</strong>, we create memorable adventures — from city tours to Big Five safaris and multi-day regional expeditions.</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {philosophy.map((p) => <li key={p} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">{p}</li>)}
              </ul>
            </div>
            <img src={img("savanna-plains-sunset")} alt="Savanna plains at sunset" className="h-80 w-full rounded-l-2xl rounded-r-[6rem] object-cover md:h-full" />
          </section>

          {/* Services */}
          <section id="tours" className="rounded-3xl bg-background p-6 md:p-12">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Our <span className="text-clay">tours</span></h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {services.map((s) => (
                <article key={s.t} className="group overflow-hidden rounded-2xl bg-card shadow-sm">
                  <img src={img(s.i)} alt={s.t} className="h-56 w-full object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold">{s.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Tours operate using high-quality rental vehicles, ensuring safety and comfort.</p>
          </section>

          {/* Destinations + Why */}
          <section id="destinations" className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-primary p-6 text-primary-foreground md:p-12">
              <h2 className="text-3xl font-bold md:text-4xl">Where we go</h2>
              <ol className="mt-8 divide-y divide-primary-foreground/20">
                {destinations.map((d, i) => (
                  <li key={d} className="flex items-baseline gap-5 py-4 text-lg font-medium"><span className="text-sm opacity-60">0{i + 1}</span>{d}</li>
                ))}
                <li className="flex items-baseline gap-5 py-4 text-lg font-medium"><span className="text-sm opacity-60">+</span>Botswana & Zimbabwe — Chobe, Victoria Falls</li>
              </ol>
            </div>
            <div className="rounded-3xl bg-background p-6 md:p-12">
              <h2 className="text-3xl font-bold md:text-4xl">Why <span className="text-clay">us?</span></h2>
              <ul className="mt-8 space-y-4">
                {why.map((w) => <li key={w} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{w}</li>)}
              </ul>
              <h3 className="mt-10 font-semibold">Who we serve</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {serve.map((s) => <span key={s} className="rounded-full border px-3 py-1.5 text-sm">{s}</span>)}
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section id="gallery" className="rounded-3xl bg-background p-6 md:p-12">
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Gallery</h2>
              <a href="https://photos.app.goo.gl/1erfm9vzeVDA91QDA" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary">View all photos →</a>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.map((g, i) => (
                <img key={g} src={img(g)} alt={g.replace(/-/g, " ")} className={`h-48 w-full object-cover md:h-60 ${i % 3 === 0 ? "rounded-r-[4rem] rounded-l-xl" : "rounded-xl"}`} />
              ))}
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="grid gap-8 rounded-3xl bg-background p-6 md:grid-cols-3 md:p-12">
            <div className="md:col-span-1">
              <h2 className="text-4xl font-bold tracking-tight">Let's plan your <span className="text-clay">adventure</span></h2>
              <p className="mt-4 text-sm text-muted-foreground">Payment by Cash or EFT.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
              {[
                { n: "Kamwi Kays", p: "+264 (81) 761 8297", t: "264817618297" },
                { n: "Fiona Kays", p: "+264 (81) 339 4533", t: "264813394533" },
              ].map((c) => (
                <div key={c.n} className="rounded-2xl bg-card p-5">
                  <p className="font-semibold">{c.n}</p>
                  <p className="text-sm text-muted-foreground">{c.p}</p>
                  <div className="mt-4 flex gap-2">
                    <a href={`tel:+${c.t}`} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Phone className="h-4 w-4" />Call</a>
                    <a href={`https://api.whatsapp.com/send?phone=${c.t}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"><MessageCircle className="h-4 w-4" />WhatsApp</a>
                  </div>
                </div>
              ))}
              <div className="space-y-3 rounded-2xl bg-card p-5 text-sm">
                <a href="mailto:info@pelicantoursandsafaris.com" className="flex gap-3"><Mail className="h-4 w-4 text-clay" />info@pelicantoursandsafaris.com</a>
                <a href="https://www.facebook.com/100076147358304" target="_blank" rel="noreferrer" className="flex gap-3"><Facebook className="h-4 w-4 text-clay" />Pelican Tours and Safaris</a>
              </div>
              <div className="space-y-3 rounded-2xl bg-card p-5 text-sm">
                <p className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-clay" />10 Fabri Street, Pionierspark, Windhoek, Namibia</p>
                <p className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-clay" />Monday – Friday, 8:00am – 5:00pm</p>
              </div>
            </div>
          </section>

          <footer className="py-6 text-center text-sm text-primary-foreground/80">© {new Date().getFullYear()} Pelican Tours and Safaris CC · Windhoek, Namibia</footer>
        </div>
      </div>
    </div>
  );
}
