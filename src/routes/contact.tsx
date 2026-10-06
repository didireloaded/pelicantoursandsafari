import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section, meta } from "@/components/site";
import { company, whatsapp } from "@/lib/pelican";

export const Route = createFileRoute("/contact")({
  head: () => meta("Contact", "Call or WhatsApp Kamwi or Fiona Kays, or visit Pelican at 10 Fabri Street, Pionierspark, Windhoek.", "baboon"),
  component: Contact,
});

function Contact() {
  const label = "text-xs font-semibold uppercase tracking-[0.2em] text-clay";
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to" accent="Pelican" image="baboon" />
      <Section className="pt-0 md:pt-0">
        {company.contacts.map((c) => (
          <div key={c.tel} className="grid gap-4 border-t border-border/70 py-8 md:grid-cols-12 md:items-center">
            <p className="text-3xl font-bold tracking-tight md:col-span-4">{c.name}</p>
            <a href={`tel:+${c.tel}`} className="text-xl md:col-span-4">{c.display}</a>
            <div className="flex gap-3 md:col-span-4 md:justify-end">
              <a href={`tel:+${c.tel}`} className="rounded-lg border border-foreground/20 px-5 py-3 text-sm font-semibold">Call</a>
              <a href={whatsapp(undefined, c.tel)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">WhatsApp</a>
            </div>
          </div>
        ))}
        <div className="grid gap-10 border-t border-border/70 pt-12 md:grid-cols-4">
          <div><p className={label}>Office</p><div className="mt-3 leading-7">{company.address.map((a) => <p key={a}>{a}</p>)}</div></div>
          <div><p className={label}>Hours</p><p className="mt-3">{company.hours}</p></div>
          <div><p className={label}>Online</p><a href={`mailto:${company.email}`} className="mt-3 block break-all">{company.email}</a><a href={company.facebook} target="_blank" rel="noreferrer" className="block">Facebook</a></div>
          <div><p className={label}>Payment</p><p className="mt-3">{company.payment.join(" · ")}</p></div>
        </div>
      </Section>
    </>
  );
}
