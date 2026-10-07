import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Phone, Menu, X, MessageCircle } from "lucide-react";
import { company, img, whatsapp } from "@/lib/pelican";
import logo from "@/assets/pelican-logo.png.asset.json";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/safaris", label: "Safaris" },
  { to: "/destinations", label: "Destinations" },
  { to: "/tailor-made", label: "Tailor-Made" },
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-20 md:px-10">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
          <img src={logo.url} alt="" className="h-11 w-11 object-contain" /> Pelican
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {nav.slice(1).map((n) => (
            <Link key={n.to} to={n.to} className="text-foreground/75 hover:text-foreground" activeProps={{ className: "!text-clay" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/tailor-made" className="hidden rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground md:inline-block">
            Plan Your Safari
          </Link>
          <a href={`tel:+${company.contacts[0]?.tel ?? ""}`} aria-label="Call Pelican" className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground md:hidden">
            <Phone className="h-4 w-4" />
          </a>
          <Button variant="ghost" size="icon" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background px-5 py-6 lg:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block border-b border-border/60 py-4 text-3xl font-semibold tracking-tight" activeProps={{ className: "text-clay" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background pb-24 md:pb-0">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <p className="flex items-center gap-3 text-lg font-semibold"><img src={logo.url} alt="" className="h-12 w-12 object-contain" />{company.name}</p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">Proudly Namibian, professionally guided safaris and tours.</p>
        </div>
        <div className="text-sm leading-7">
          {company.address.map((a) => <p key={a}>{a}</p>)}
          <p className="mt-2 text-muted-foreground">{company.hours}</p>
        </div>
        <div className="text-sm leading-7">
          {company.contacts.map((c) => <a key={c.tel} href={`tel:+${c.tel}`} className="block">{c.display} · {c.name}</a>)}
          <a href={`mailto:${company.email}`} className="block">{company.email}</a>
        </div>
      </div>
      <p className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {company.legal} · Windhoek, Namibia</p>
    </footer>
  );
}

export function MobileActions() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background text-[11px] font-medium md:hidden">
      <Link to="/safaris" className="py-3 text-center">Safaris</Link>
      <a href={whatsapp()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 py-3"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
      <a href={`tel:+${company.contacts[0]?.tel ?? ""}`} className="flex items-center justify-center gap-1 py-3"><Phone className="h-3.5 w-3.5" />Call</a>
      <Link to="/tailor-made" className="bg-primary py-3 text-center text-primary-foreground">Plan Safari</Link>
    </div>
  );
}

/** Signature long photo cutout, set inline with large type. */
export function Strip({ src, shape = "right", className = "" }: { src: string; shape?: "right" | "left" | "both"; className?: string }) {
  const r = shape === "right" ? "rounded-l-xl rounded-r-[5rem]" : shape === "left" ? "rounded-l-[5rem] rounded-r-xl" : "rounded-[5rem]";
  return <img src={img(src)} alt="" className={`object-cover ${r} ${className}`} />;
}

/** Interior page hero: big headline + photo strip. */
export function PageHero({ eyebrow, title, accent, image, children }: { eyebrow?: string; title: string; accent?: string; image: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-12 md:px-10 md:pb-20 md:pt-20">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{eyebrow}</p>}
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <h1 className="text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
          {title} {accent && <span className="text-clay">{accent}</span>}
        </h1>
        <Strip src={image} className="h-24 w-full md:h-32 md:flex-1" />
      </div>
      {children && <div className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{children}</div>}
    </section>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-24 ${className}`}>{children}</section>;
}

export function PlanCTA() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-16 md:flex-row md:items-end md:justify-between md:px-10 md:py-24">
        <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">Let's plan your Namibian story.</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/tailor-made" className="rounded-lg bg-background px-6 py-3.5 text-sm font-semibold text-foreground">Plan Your Safari</Link>
          <a href={whatsapp()} target="_blank" rel="noreferrer" className="rounded-lg border border-primary-foreground/40 px-6 py-3.5 text-sm font-semibold">WhatsApp Kamwi</a>
        </div>
      </div>
    </section>
  );
}

export function meta(title: string, description: string, image?: string) {
  const m = [
    { title: `${title} — Pelican Tours and Safaris` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Pelican Tours and Safaris` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (image) m.push({ property: "og:image", content: img(image) }, { name: "twitter:image", content: img(image) });
  return { meta: m };
}
