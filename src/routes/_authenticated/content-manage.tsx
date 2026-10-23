import { AppSelect } from "@/components/ui/app-select";
import { AdminNavigation } from "@/components/admin/navigation";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/site";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SafariPackageEditor } from "@/components/safari-package-editor";
import { safariPackageSchema, type SafariPackage } from "@/lib/safari-package";
import { getSafari } from "@/lib/pelican";
import { ZodError } from "zod";
type Detail = Database["public"]["Tables"]["travel_details"]["Row"];
const blank = {
  category: "itinerary",
  title: "",
  body: "",
  source_url: "",
  photo_url: "",
  approved: false,
};
export const Route = createFileRoute("/_authenticated/content-manage")({
  head: () => ({
    meta: [{ title: "Approved content — Pelican" }, { name: "robots", content: "noindex" }],
  }),
  component: Manage,
});
function Manage() {
  const { user } = Route.useRouteContext();
  const [staff, setStaff] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Detail[]>([]);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState(blank);
  const [safariSlug, setSafariSlug] = useState("");
  const [packageDetails, setPackageDetails] = useState<SafariPackage | null>(null);
  const [unsupportedPackage, setUnsupportedPackage] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function load() {
    try {
      const role = await supabase.rpc("can_manage_site");
      if (role.error) throw role.error;
      setStaff(!!role.data);
      if (!role.data) return;
      const result = await supabase
        .from("travel_details")
        .select("*")
        .order("updated_at", { ascending: false });
      if (result.error) throw result.error;
      setRows(result.data ?? []);
    } catch {
      setMessage("Content could not be loaded. Please retry.");
    }
  }
  useEffect(() => {
    void load();
  }, [user.id]);
  const field = "mt-2 w-full border-b bg-transparent py-3";
  if (staff === false)
    return (
      <Section>
        <h1 className="text-3xl">Staff access required</h1>
      </Section>
    );
  return (
    <Section>
      {staff && <AdminNavigation />}
      <h1 className="font-display text-5xl">Approved information</h1>
      <p className="mt-6">
        Approved entries appear in the public Travel Guide, safari planning guidance and relevant
        safari pages. Draft entries stay private. Publish only verified facts with a source; never
        invent reviews, qualifications or prices.
      </p>
      <Link to="/travel-guide" className="mt-4 inline-block text-primary underline">
        View the public Travel Guide →
      </Link>
      <p role="status" className="mt-4">
        {message}
      </p>
      <Button className="mt-4" variant="outline" onClick={load}>
        Reload
      </Button>
      {staff && (
        <>
          <label className="mt-8 block">
            Edit content
            <AppSelect
              className={field}
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                const row = rows.find((r) => r.id === e.target.value);
                setForm(row ? { ...row, photo_url: row.photo_url ?? "" } : blank);
                setSafariSlug(row?.safari_slug ?? "");
                const parsed = safariPackageSchema.safeParse(row?.package_details);
                setUnsupportedPackage(!!row?.package_details && !parsed.success);
                setPackageDetails(parsed.success ? parsed.data : null);
                setMessage(
                  row?.package_details && !parsed.success
                    ? "This package has an unsupported format. Reload or enter verified package fields before saving."
                    : "",
                );
              }}
            >
              <option value="">New entry</option>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.approved ? "Published" : "Draft"})
                </option>
              ))}
            </AppSelect>
          </label>
          <form
            className="mt-8 space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              try {
                if (unsupportedPackage) {
                  setMessage(
                    "Not saved. This entry uses an unsupported package format; select the catalogue safari again to replace it with verified fields, or reload.",
                  );
                  return;
                }
                const source = new URL(form.source_url);
                if (source.protocol !== "https:") throw new Error();
                if (form.photo_url && new URL(form.photo_url).protocol !== "https:")
                  throw new Error();
                if (safariSlug && !getSafari(safariSlug)) throw new Error();
                const details =
                  form.category === "itinerary" && packageDetails
                    ? safariPackageSchema.parse({
                        ...packageDetails,
                        inclusions: packageDetails.inclusions
                          .map((item) => item.trim())
                          .filter(Boolean),
                        exclusions: packageDetails.exclusions
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    : null;
                if (details && !safariSlug) throw new Error();
                const body = {
                  category: form.category,
                  source_url: form.source_url,
                  approved: form.approved,
                  photo_url: form.photo_url || null,
                  title: form.title.trim(),
                  body: form.body.trim(),
                  updated_by: user.id,
                  safari_slug: details ? safariSlug : null,
                  package_details: details,
                };
                const previous = rows.find((r) => r.id === selected);
                const result = previous
                  ? await supabase
                      .from("travel_details")
                      .update(body)
                      .eq("id", previous.id)
                      .eq("updated_at", previous.updated_at)
                      .select()
                      .single()
                  : await supabase.from("travel_details").insert(body).select().single();
                if (result.error || !result.data) throw result.error;
                await load();
                setSelected(result.data.id);
                setMessage(
                  form.approved
                    ? "Verified entry published."
                    : "Draft saved; hidden from public readers.",
                );
              } catch (error) {
                setMessage(
                  error instanceof ZodError
                    ? `Not saved. ${error.issues[0]?.message ?? "Check the package fields."}`
                    : "Not saved. Check source URLs and package fields. Only one package per safari can be published. Reload before retrying if another staff member edited this entry.",
                );
              } finally {
                setBusy(false);
                lock.current = false;
              }
            }}
          >
            <label className="block">
              Category
              <AppSelect
                className={field}
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  if (e.target.value !== "itinerary") {
                    setSafariSlug("");
                    setPackageDetails(null);
                    setUnsupportedPackage(false);
                  }
                }}
              >
                {[
                  "itinerary",
                  "pricing",
                  "accommodation",
                  "guide",
                  "vehicle",
                  "review",
                  "credential",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </AppSelect>
            </label>
            <label className="block">
              Title
              <input
                required
                maxLength={200}
                className={field}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="block">
              Verified information
              <textarea
                required
                maxLength={12000}
                rows={12}
                className="mt-2 w-full border bg-transparent p-3"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </label>
            {form.category === "itinerary" && (
              <SafariPackageEditor
                slug={safariSlug}
                value={packageDetails}
                onChange={(slug, details) => {
                  setSafariSlug(slug);
                  setPackageDetails(details);
                  setUnsupportedPackage(false);
                }}
              />
            )}
            <label className="block">
              Source URL
              <input
                required
                type="url"
                maxLength={1999}
                className={field}
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              />
            </label>
            <label className="block">
              Approved photo URL (optional)
              <input
                type="url"
                maxLength={1999}
                className={field}
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              />
              <span className="mt-2 block text-sm">
                Use a verified HTTPS image you have permission to publish.
              </span>
            </label>
            <label className="block">
              <input
                type="checkbox"
                className="mr-3 accent-primary"
                checked={form.approved}
                onChange={(e) => setForm({ ...form, approved: e.target.checked })}
              />
              I have verified this information and approve public publication.
            </label>
            <Button disabled={busy}>Save entry</Button>
          </form>
        </>
      )}
    </Section>
  );
}
