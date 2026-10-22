import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, Map, CalendarDays } from "lucide-react";
import { Photo, Section } from "@/components/site";

const panels = [
  {
    title: "Explore safaris",
    description: "Discover wildlife, landscapes and cultural journeys in our catalogue.",
    image: "leopard",
    to: "/safaris",
    hash: "",
    action: "Find your safari",
    icon: Compass,
  },
  {
    title: "Plan my journey",
    description: "Bring your destinations and stays together, then share your Safari Brief.",
    image: "car-safari-scene",
    to: "/journey",
    hash: "",
    action: "Build your journey",
    icon: Map,
  },
  {
    title: "When to visit",
    description: "Explore seasonal conditions and practical advice for your travel month.",
    image: "savanna-plains-sunset",
    to: "/travel-guide",
    hash: "travel-calendar",
    action: "Explore the calendar",
    icon: CalendarDays,
  },
] as const;

export function JourneyPanels() {
  const [active, setActive] = useState(0);
  return (
    <Section className="pt-0 md:pt-0">
      <h2 className="text-3xl font-semibold md:text-4xl">Three ways to start planning</h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Browse tours, bring destinations and stays together, or check when to travel.
      </p>
      <div className="journey-panels relative mt-8 overflow-hidden rounded-lg bg-foreground">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
          {panels.map((panel, index) => (
            <div
              key={panel.title}
              className={`journey-panel-background absolute inset-0 ${active === index ? "opacity-100" : "opacity-0"}`}
            >
              <Photo
                pan={false}
                name={panel.image}
                alt=""
                media="(min-width: 768px)"
                sizes="(min-width: 1440px) 1360px, calc(100vw - 80px)"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="relative grid md:grid-cols-3">
          {panels.map((panel, index) => (
            <Link
              key={panel.title}
              to={panel.to}
              hash={panel.hash}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setActive(index);
              }}
              onFocus={() => setActive(index)}
              className="journey-panel group relative flex min-h-64 flex-col justify-end overflow-hidden border-b border-background/25 p-6 text-background last:border-b-0 focus-visible:z-10 focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-background md:min-h-80 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 md:hidden">
                <Photo
                  pan={false}
                  name={panel.image}
                  alt=""
                  media="(max-width: 767px)"
                  sizes="calc(100vw - 40px)"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-foreground/65"
              />
              <div className="journey-panel-copy relative">
                <panel.icon aria-hidden="true" className="mb-4 h-7 w-7" />
                <h3 className="text-2xl font-semibold">{panel.title}</h3>
                <p className="mt-3 text-sm leading-relaxed">{panel.description}</p>
                <span className="mt-5 inline-block text-sm font-semibold">
                  {panel.action}{" "}
                  <span aria-hidden="true" className="discovery-card-arrow inline-block">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}
