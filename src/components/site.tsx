import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Phone, Menu, X, MessageCircle } from "lucide-react";
import { company, img, imageDimensions, imageSrcSet, whatsapp } from "@/lib/pelican";
import { siteOrigin } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { usePhotoPan } from "@/components/use-photo-pan";

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
          <img src="/pelican-logo.png" alt="" className="h-11 w-11 object-contain" /> Pelican
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-medium lg:flex">
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
          <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpen(!open)} className="lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background px-5 py-6 lg:hidden">
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
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 md:grid-cols-2 md:px-10 lg:grid-cols-4">
        <div className="md:col-span-2">
          <p className="flex items-center gap-3 text-lg font-semibold"><img src="/pelican-logo.png" alt="" className="h-12 w-12 object-contain" />{company.name}</p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">Proudly Namibian, professionally guided safaris and tours.</p>
        </div>
        <div className="text-sm leading-7">
          {company.address.map((a) => <p key={a}>{a}</p>)}
          <p className="mt-2 text-muted-foreground">{company.hours}</p>
        </div>
        <div className="text-sm leading-7">
          {company.contacts.map((c) => <a key={c.tel} href={`tel:+${c.tel}`} className="block">{c.display} · {c.name}</a>)}
          <a href={`mailto:${company.email}`} className="block break-words">{company.email}</a>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap gap-6 px-5 pb-8 text-sm md:px-10"><Link to="/stay" className="text-primary">Places to stay</Link><Link to="/trips" className="text-sm hover:text-clay">My trips</Link><Link to="/journey" className="text-primary">Build my journey</Link><Link to="/match">Safari match</Link><Link to="/shortlist" search={{saved:"[]"}}>Shortlist</Link><Link to="/travel-guide">Travel guide</Link><Link to="/proposals" search={{}}>My proposals</Link></div>
      <p className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {company.legal} · Windhoek, Namibia</p>
    </footer>
  );
}

export function MobileActions() {
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background text-[11px] font-medium md:hidden">
      <Link to="/safaris" className="py-3 text-center">Safaris</Link>
      <a href={whatsapp()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 py-3"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
      <a href={`tel:+${company.contacts[0]?.tel ?? ""}`} className="flex items-center justify-center gap-1 py-3"><Phone className="h-3.5 w-3.5" />Call</a>
      <Link to="/tailor-made" className="bg-primary py-3 text-center text-primary-foreground">Plan Safari</Link>
    </nav>
  );
}

type PhotoProps = {
  name: string;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  media?: string;
  pan?: boolean;
};

/** Responsive sources stay out of layout; only the image occupies a flex/grid cell. */
export function Photo({ name, alt, className, sizes = "(min-width: 1440px) 1360px, calc(100vw - 40px)", loading = "lazy", fetchPriority = "auto", media, pan: allowPan = true }: PhotoProps) {
  const dimensions = imageDimensions[name];
  const pan = usePhotoPan();
  const interactive = allowPan && !!className?.includes("object-cover");
  // Native lazy-image auto sizing uses the actual slot; the existing sizes remain a fallback.
  const responsiveSizes = loading === "lazy" ? `auto, ${sizes}` : sizes;
  return (
    <picture className="contents">
      <source className="hidden" type="image/avif" srcSet={imageSrcSet(name, "avif")} sizes={responsiveSizes} media={media} />
      <source className="hidden" type="image/webp" srcSet={imageSrcSet(name)} sizes={responsiveSizes} media={media} />
      <img
        {...(interactive ? pan : {})}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `${alt || name.replace(/-/g, " ")}. Use arrow keys to explore the photo; Escape resets the view.` : undefined}
        src={media ? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" : img(name, 1280)}
        srcSet={media ? undefined : imageSrcSet(name)}
        sizes={responsiveSizes}
        width={dimensions?.width}
        height={dimensions?.height}
        alt={alt}
        className={`${interactive ? "pan-photo focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" : ""} min-w-0 max-w-full ${name === "hyena" ? "object-[50%_15%]" : ""} ${className ?? ""}`}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    </picture>
  );
}

/** Signature long photo cutout, set inline with large type. */
export function Strip({ src, shape = "right", className = "", animateOnHover = false, ...props }: { src: string; animateOnHover?: boolean; shape?: "right" | "left" | "both"; className?: string } & Omit<PhotoProps, "name" | "alt" | "className">) {
  const r = shape === "right" ? "rounded-l-xl rounded-r-[5rem]" : shape === "left" ? "rounded-l-[5rem] rounded-r-xl" : "rounded-[5rem]";
  if (animateOnHover) return <div className={`min-w-0 max-w-full overflow-hidden ${r} ${className}`}><Photo name={src} alt="" className="discovery-card-image h-full w-full object-cover" {...props} /></div>;
  return <Photo name={src} alt="" className={`object-cover ${r} ${className}`} {...props} />;
}

/** Interior page hero: big headline + photo strip. */
export function PageHero({ eyebrow, title, accent, image, children }: { eyebrow?: string; title: string; accent?: string; image: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-12 md:px-10 md:pb-20 md:pt-20">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{eyebrow}</p>}
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <h1 className="text-5xl font-bold leading-[1.02] tracking-tight md:max-w-[65%] md:text-6xl lg:text-7xl">
          {title} {accent && <span className="text-clay">{accent}</span>}
        </h1>
        <Strip src={image} loading="eager" fetchPriority="high" sizes="(min-width: 768px) 50vw, calc(100vw - 40px)" className="h-24 w-full md:ml-auto md:h-28 md:w-0 md:max-w-lg md:flex-1" />
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
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-16 lg:flex-row lg:items-end lg:justify-between md:px-10 md:py-20">
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
  const origin = siteOrigin(import.meta.env["VITE_SITE_ORIGIN"]);
  if (image && origin) {
    const url = new URL(img(image), origin).href;
    m.push({ property: "og:image", content: url }, { name: "twitter:image", content: url });
  }
  return { meta: m };
}
