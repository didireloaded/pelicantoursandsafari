import { AppSelect } from "@/components/ui/app-select";
import { ZodError } from "zod";
import { Strip } from "@/components/site";
import { useBlocker } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SafariPackageEditor } from "@/components/safari-package-editor";
import { SafariPackageDetails } from "@/components/approved-safari-package";
import { ContentPhoto } from "@/components/content-photo";
import { PhotoUpload } from "./photo-upload";
import { destinations, images, planningInterests } from "@/lib/pelican";
import {
  blankPackage,
  parseContent,
  type ContentData,
  type ContentKind,
  type ContentRow,
  type PackageContent,
  type PhotoContent,
} from "@/lib/site-content";
import { saveContent, staffContent } from "@/lib/site-content-api";

const field =
  "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const newPhoto = (): PhotoContent => ({
  destination: "etosha",
  path: "",
  alt: "",
  caption: "",
  position: 0,
});
export function ContentEditor({ kind, userId }: { kind: ContentKind; userId: string }) {
  const client = useQueryClient();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [selected, setSelected] = useState<ContentRow>();
  const [data, setData] = useState<ContentData>(kind === "package" ? blankPackage() : newPhoto());
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<
    { revision: number; draft: unknown; action: string; changed_at: string }[]
  >([]);
  const lock = useRef(false);
  const newId = useRef(crypto.randomUUID());
  const load = useCallback(async () => {
    try {
      const result = await staffContent(kind);
      setRows(result);
      setLoaded(true);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }, [kind]);
  useEffect(() => {
    void load();
  }, [load]);
  useBlocker({
    shouldBlockFn: () =>
      busy ||
      uploading ||
      (dirty && !window.confirm("Discard unsaved changes and leave this page?")),
    enableBeforeUnload: () => dirty || busy || uploading,
  });
  const change = (next: ContentData) => {
    setData(next);
    setDirty(true);
    setPreview(false);
  };
  const choose = (row?: ContentRow) => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setSelected(row);
    setData(row?.draft ?? (kind === "package" ? blankPackage() : newPhoto()));
    newId.current = crypto.randomUUID();
    setDirty(false);
    setHistory([]);
    setPreview(false);
    setMessage("");
  };
  async function save(action: "save" | "publish" | "unpublish") {
    if (lock.current || uploading) return;
    lock.current = true;
    setBusy(true);
    setMessage("Saving…");
    try {
      const result = await saveContent(
        selected?.id ?? newId.current,
        kind,
        selected?.revision ?? 0,
        action,
        data,
      );
      setSelected(result);
      setData(result.draft);
      setDirty(false);
      setMessage(
        action === "publish"
          ? "Published. The website now uses this version."
          : action === "unpublish"
            ? "Unpublished. Hidden from the website; your saved content is retained."
            : "Draft saved. The public version has not changed.",
      );
      await client.invalidateQueries({ queryKey: ["site-content", kind] });
      await load();
    } catch (error) {
      setMessage(
        error instanceof ZodError
          ? `Not saved. ${error.issues[0]?.message ?? "Check the required fields."}`
          : error instanceof Error
            ? error.message
            : "Not saved. Please retry.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const p = data as PackageContent;
  const photo = data as PhotoContent;
  return (
    <div className="admin-content-editor">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">YOUR WEBSITE</p>
          <h1 className="mt-2">{kind === "package" ? "Packages" : "Gallery"}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {kind === "package"
              ? "Create a package with its own page, itinerary and verified prices. Existing safari categories remain available under Travel information."
              : "Add photographs to your destination albums. Use the display order to arrange photos; lower numbers appear first."}
          </p>
        </div>
      </div>
      <p role="status" className="my-5 text-sm">
        {message || (!loaded ? "Loading your content…" : "")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={busy || uploading} onClick={() => choose()}>
          New {kind === "package" ? "package" : "photo"}
        </Button>
        <Button
          variant="ghost"
          disabled={busy || uploading}
          onClick={async () => {
            if (dirty && !window.confirm("Reload and discard unsaved changes?")) return;
            const id = selected?.id;
            try {
              const fresh = await staffContent(kind);
              setRows(fresh);
              const row = fresh.find((item) => item.id === id);
              setSelected(row);
              if (row) setData(row.draft);
              setDirty(false);
              setMessage("Latest saved version loaded.");
              setLoaded(true);
            } catch {
              setMessage("Could not reload. Your text is still here.");
            }
          }}
        >
          Reload saved version
        </Button>
      </div>
      <label className="admin-panel mt-6 block max-w-4xl p-5 text-xs">
        Choose an entry
        <AppSelect
          className={field}
          disabled={busy || uploading}
          value={selected?.id ?? ""}
          onChange={(event) => choose(rows.find((row) => row.id === event.target.value))}
        >
          <option value="">New entry</option>
          {rows.map((row) => (
            <option key={row.id} value={row.id}>
              {kind === "package"
                ? (row.draft as PackageContent).title
                : `${destinations.find((place) => place.slug === (row.draft as PhotoContent).destination)?.name} — ${(row.draft as PhotoContent).caption || (row.draft as PhotoContent).alt}`}{" "}
              ·{" "}
              {row.published
                ? JSON.stringify(row.draft) === JSON.stringify(row.published)
                  ? "Live"
                  : "Live + draft changes"
                : "Draft"}
            </option>
          ))}
        </AppSelect>
      </label>
      <form
        className="admin-panel admin-form mt-6 max-w-4xl space-y-6 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save("save");
        }}
      >
        <fieldset disabled={busy || uploading || !loaded} className="space-y-6">
          {kind === "package" ? (
            <>
              {(
                [
                  ["title", "Package name", 200],
                  ["summary", "Short description", 400],
                  ["description", "Full description", 12000],
                ] as const
              ).map(([key, label, max]) => (
                <label className="block" key={key}>
                  {label}
                  {key === "title" ? (
                    <input
                      required
                      maxLength={max}
                      className={field}
                      value={p[key]}
                      onChange={(event) => change({ ...p, [key]: event.target.value })}
                    />
                  ) : (
                    <textarea
                      required
                      rows={key === "description" ? 5 : 2}
                      maxLength={max}
                      className={field}
                      value={p[key]}
                      onChange={(event) => change({ ...p, [key]: event.target.value })}
                    />
                  )}
                </label>
              ))}
              <fieldset className="border border-border p-5">
                <legend>Destinations</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {destinations.map((place) => (
                    <label key={place.slug} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={p.destinations.includes(place.slug)}
                        onChange={(event) =>
                          change({
                            ...p,
                            destinations: event.target.checked
                              ? [...p.destinations, place.slug]
                              : p.destinations.filter((slug) => slug !== place.slug),
                          })
                        }
                      />
                      {place.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="border border-border p-5">
                <legend>Experiences</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {planningInterests.map((interest) => (
                    <label key={interest} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={p.interests.includes(interest)}
                        onChange={(event) =>
                          change({
                            ...p,
                            interests: event.target.checked
                              ? [...p.interests, interest]
                              : p.interests.filter((item) => item !== interest),
                          })
                        }
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                Existing cover photograph
                <AppSelect
                  className={field}
                  value={p.image}
                  onChange={(event) => change({ ...p, image: event.target.value })}
                >
                  {images.map((image) => (
                    <option key={image} value={image}>
                      {image.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase())}
                    </option>
                  ))}
                </AppSelect>
              </label>
              <PhotoUpload
                userId={userId}
                path={p.coverPath}
                onChange={(path) => change({ ...p, coverPath: path })}
                onBusy={setUploading}
              />
              {p.coverPath && (
                <>
                  <label className="block">
                    Describe the cover photograph
                    <input
                      required
                      className={field}
                      maxLength={300}
                      value={p.coverAlt}
                      onChange={(event) => change({ ...p, coverAlt: event.target.value })}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => change({ ...p, coverPath: null, coverAlt: "" })}
                  >
                    Use existing cover instead
                  </Button>
                </>
              )}
              <details className="border-y border-border py-5">
                <summary className="cursor-pointer text-xl">
                  Itinerary, inclusions & pricing (optional)
                </summary>
                <div className="mt-5">
                  <SafariPackageEditor
                    catalogueSelection={false}
                    slug=""
                    value={p.details}
                    onChange={(_, details) => details && change({ ...p, details })}
                  />
                </div>
              </details>
            </>
          ) : (
            <>
              <label className="block">
                Destination album
                <AppSelect
                  className={field}
                  value={photo.destination}
                  onChange={(event) => change({ ...photo, destination: event.target.value })}
                >
                  {destinations.map((place) => (
                    <option key={place.slug} value={place.slug}>
                      {place.name}
                    </option>
                  ))}
                </AppSelect>
              </label>
              <PhotoUpload
                userId={userId}
                path={photo.path || null}
                onChange={(path) => change({ ...photo, path })}
                onBusy={setUploading}
              />
              <label className="block">
                Describe the photo for accessibility
                <input
                  required
                  className={field}
                  maxLength={300}
                  value={photo.alt}
                  onChange={(event) => change({ ...photo, alt: event.target.value })}
                />
              </label>
              <label className="block">
                Caption (optional)
                <textarea
                  className={field}
                  maxLength={600}
                  value={photo.caption}
                  onChange={(event) => change({ ...photo, caption: event.target.value })}
                />
              </label>
              <label className="block">
                Display order
                <input
                  type="number"
                  min="0"
                  max="9999"
                  step="1"
                  required
                  className={field}
                  value={photo.position}
                  onChange={(event) => change({ ...photo, position: Number(event.target.value) })}
                />
              </label>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            Publishing confirms you have checked the facts, prices and permissions. This does not
            create live availability or instant bookings.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save draft</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                try {
                  parseContent(kind, data);
                  setPreview(true);
                  setMessage("");
                } catch {
                  setMessage("Complete the required fields before previewing.");
                }
              }}
            >
              Preview
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (window.confirm("Publish this version to the public website?"))
                  void save("publish");
              }}
            >
              Publish
            </Button>
            {selected?.published && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (window.confirm("Hide this entry from the public website?"))
                    void save("unpublish");
                }}
              >
                Unpublish
              </Button>
            )}
          </div>
        </fieldset>
      </form>
      {preview && (
        <section aria-label="Draft preview" className="mt-10 border border-border p-6">
          <p className="text-sm text-clay">Private draft preview</p>
          {kind === "package" ? (
            <>
              <h2 className="mt-4 text-3xl">{p.title}</h2>
              <p className="mt-4">{p.description}</p>
              {p.coverPath ? (
                <ContentPhoto path={p.coverPath} alt={p.coverAlt} />
              ) : (
                <Strip src={p.image} className="mt-5 h-64 w-full" />
              )}
              <div className="mt-8">
                <SafariPackageDetails
                  details={p.details}
                  sourceUrl="https://pelicantoursandsafari.com/contact"
                  updatedAt={new Date().toISOString()}
                />
              </div>
            </>
          ) : (
            <figure>
              <ContentPhoto path={photo.path} alt={photo.alt} />
              <figcaption className="mt-3">{photo.caption}</figcaption>
            </figure>
          )}
        </section>
      )}
      {selected && (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-2xl">Version history</h2>
          <Button
            className="mt-4"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              const result = await supabase
                .from("site_content_history")
                .select("revision,draft,action,changed_at")
                .eq("content_id", selected.id)
                .order("revision", { ascending: false })
                .limit(20);
              if (result.error) setMessage("History could not be loaded.");
              else setHistory(result.data ?? []);
            }}
          >
            Load recent versions
          </Button>
          <ul className="mt-4 space-y-3">
            {history.map((entry) => (
              <li
                key={entry.revision}
                className="flex flex-wrap items-center gap-4 border-b border-border py-3"
              >
                <span>
                  Version {entry.revision} ·{" "}
                  {{ save: "Draft saved", publish: "Published", unpublish: "Unpublished" }[
                    entry.action
                  ] ?? "Updated"}{" "}
                  · {new Date(entry.changed_at).toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  disabled={busy || uploading}
                  onClick={() => {
                    try {
                      const restored = parseContent(kind, entry.draft);
                      if (
                        !dirty ||
                        window.confirm("Replace your unsaved changes with this version?")
                      )
                        change(restored);
                    } catch {
                      setMessage("This version cannot be opened. Contact your website manager.");
                    }
                  }}
                >
                  Use as draft
                </Button>
              </li>
            ))}
          </ul>
          {selected.published && kind === "package" && (
            <a
              href={`/packages/${selected.id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block text-primary underline"
            >
              View published package ↗
            </a>
          )}
        </section>
      )}
    </div>
  );
}
