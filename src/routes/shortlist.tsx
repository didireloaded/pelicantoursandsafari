import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";
import { safaris, stays } from "@/lib/pelican";
import { parseShortlist, readShortlist, writeShortlist, type SavedChoice } from "@/lib/shortlist";
export const Route = createFileRoute("/shortlist")({
  head: () => ({ meta: [{ title: "Your shortlist — Pelican Tours and Safaris" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    saved: JSON.stringify(parseShortlist(s["saved"])),
  }),
  component: Shortlist,
});
function Shortlist() {
  const { saved } = Route.useSearch();
  const shared = parseShortlist(saved);
  const [items, setItems] = useState<SavedChoice[]>(shared);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setItems(shared.length ? shared : readShortlist());
  }, [saved]);
  function change(item: SavedChoice) {
    const next = items.some((x) => x.kind === item.kind && x.slug === item.slug)
      ? items.filter((x) => !(x.kind === item.kind && x.slug === item.slug))
      : [...items, item];
    setItems(next);
    try {
      writeShortlist(next);
      setMessage("Shortlist saved on this device.");
    } catch {
      setMessage("Device storage is unavailable. You can still share this shortlist.");
    }
  }
  async function share() {
    const url = new URL("/shortlist", window.location.origin);
    url.searchParams.set("saved", JSON.stringify(items));
    try {
      await navigator.clipboard.writeText(url.href);
      setMessage("Share link copied.");
    } catch {
      setMessage(url.href);
    }
  }
  return (
    <Section>
      <h1 className="font-display text-5xl">Your shortlist</h1>
      <p className="mt-6 text-muted-foreground">
        Save inspiration and share it with your travel companions. These are preferences, not
        reservations. Shared links contain only catalogue choices.
      </p>
      <Button className="mt-6" onClick={share} disabled={!items.length}>
        Copy share link
      </Button>
      <p role="status" className="my-4 break-all">
        {message}
      </p>
      {(["safari", "stay"] as const).map((kind) => (
        <div key={kind} className="mt-8">
          <h2 className="text-3xl">{kind === "safari" ? "Safaris" : "Places to stay"}</h2>
          {(kind === "safari" ? safaris : stays).map((item) => (
            <div
              key={item.slug}
              className="flex flex-wrap items-center justify-between gap-4 border-b py-5"
            >
              <Link
                to={kind === "safari" ? "/safaris/$slug" : "/stay/$slug"}
                params={{ slug: item.slug }}
              >
                {item.name} →
              </Link>
              <Button variant="outline" onClick={() => change({ kind, slug: item.slug })}>
                {items.some((x) => x.kind === kind && x.slug === item.slug)
                  ? "Remove from shortlist"
                  : "Save"}
              </Button>
            </div>
          ))}
        </div>
      ))}
      <Link
        className="mt-8 block underline"
        to="/tailor-made"
        search={{ shortlist: JSON.stringify(items) }}
      >
        Discuss your choices with Pelican →
      </Link>
    </Section>
  );
}
