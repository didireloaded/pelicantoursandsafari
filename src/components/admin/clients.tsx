import { AppSelect } from "@/components/ui/app-select";
import { useRef, useState } from "react";
import { Plus, Search, MapPin, Mail, Phone, ArrowUpRight, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "@tanstack/react-router";
import { ZodError } from "zod";
import { useWorkspace, saveClient } from "@/lib/admin-workspace-api";
import {
  blankClient,
  clientPaid,
  clientSources,
  initials,
  type Client,
  type ClientInput,
} from "@/lib/admin-workspace";
import { formatNad } from "@/lib/safari-package";
import { ContentPhoto } from "@/components/content-photo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PhotoUpload } from "./photo-upload";
import { HelpPanel } from "./help-panel";
import { WorkspaceState } from "./workspace-state";
export function Clients({ userId }: { userId: string }) {
  const query = useWorkspace();
  const data = query.data;
  const cache = useQueryClient();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [archived, setArchived] = useState(false);
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState<Client>();
  const [form, setForm] = useState<ClientInput>(blankClient);
  const [isOpen, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const id = useRef<string>(crypto.randomUUID());
  useBlocker({
    shouldBlockFn: () =>
      busy || uploading || (dirty && !window.confirm("Discard unsaved client changes?")),
    enableBeforeUnload: () => dirty || busy || uploading,
  });
  const rows = (data?.clients ?? []).filter(
    (c) =>
      c.archived === archived &&
      (!source || c.source === source) &&
      `${c.name} ${c.country} ${c.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  const current = rows.find((c) => c.id === selected) ?? rows[0];
  const edit = (client?: Client) => {
    setEditing(client);
    setForm(
      client
        ? {
            name: client.name,
            country: client.country,
            email: client.email,
            phone: client.phone,
            source: client.source,
            notes: client.notes,
            avatar_path: client.avatar_path,
            archived: client.archived,
          }
        : blankClient(),
    );
    id.current = client?.id ?? crypto.randomUUID();
    setMessage("");
    setDirty(false);
    setOpen(true);
  };
  const change = (patch: Partial<ClientInput>) => {
    setForm((old) => ({ ...old, ...patch }));
    setDirty(true);
  };
  async function save() {
    if (lock.current || uploading) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      const saved = await saveClient(id.current, editing?.revision ?? 0, form);
      await cache.invalidateQueries({ queryKey: ["admin-workspace"] });
      setSelected(saved.id);
      setDirty(false);
      setOpen(false);
    } catch (error) {
      setMessage(
        error instanceof ZodError
          ? (error.issues[0]?.message ?? "Check the fields.")
          : (error as Error).message,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const sources = clientSources
    .map((name) => ({
      name,
      count: (data?.clients ?? []).filter((c) => !c.archived && c.source === name).length,
    }))
    .filter((s) => s.count > 0);
  const total = sources.reduce((sum, s) => sum + s.count, 0);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PEOPLE & THEIR JOURNEYS</p>
          <h1 className="mt-2">Your clients</h1>
          <p>The people behind every journey. Select a client to see their details.</p>
        </div>
        <Button className="gap-2 !text-xs" onClick={() => edit()}>
          <Plus size={15} />
          Add client
        </Button>
      </div>
      <WorkspaceState
        loading={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        <div className="admin-main-grid">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="admin-tabs">
                <button
                  className={`admin-pill ${!archived ? "is-selected" : ""}`}
                  onClick={() => setArchived(false)}
                >
                  All clients
                </button>
                <button
                  className={`admin-pill ${archived ? "is-selected" : ""}`}
                  onClick={() => setArchived(true)}
                >
                  Archived
                </button>
              </div>
              <label className="admin-pill ml-auto">
                <Search size={13} />
                <input
                  aria-label="Search clients"
                  className="w-32 min-w-0 bg-transparent outline-none"
                  placeholder="Search clients"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <AppSelect
                aria-label="Filter clients by source"
                className="admin-pill max-w-full"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">All sources</option>
                {clientSources.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </AppSelect>
            </div>
            <div className="admin-client-grid">
              {rows.map((client) => {
                const paid = clientPaid(client.id, data?.trips ?? []);
                return (
                  <button
                    className="admin-panel admin-client-card"
                    key={client.id}
                    aria-pressed={current?.id === client.id}
                    onClick={() => setSelected(client.id)}
                  >
                    {client.avatar_path ? (
                      <ContentPhoto
                        path={client.avatar_path}
                        alt={client.name}
                        className="admin-avatar !object-cover"
                      />
                    ) : (
                      <span className="admin-avatar">{initials(client.name)}</span>
                    )}
                    <strong className="block truncate text-xs font-medium">{client.name}</strong>
                    <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                      {client.country || "Country not supplied"}
                    </span>
                    <div className="admin-client-meta">
                      <div>
                        <small>Source</small>
                        <strong>{client.source}</strong>
                      </div>
                      <div>
                        <small>Recorded spend</small>
                        <strong>{paid === null ? "Not recorded" : formatNad(paid)}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!rows.length && (
              <div className="admin-panel admin-empty">
                <Users size={30} className="mx-auto mb-4 opacity-40" />
                <h2 className="text-base text-foreground">
                  {search || source ? "No clients match" : "Your client directory starts here"}
                </h2>
                <p className="mx-auto mt-2 max-w-sm">
                  {search || source
                    ? "Try a different name or source."
                    : "Add a real client, then link their reservations to see recorded spending."}
                </p>
                {!search && !source && (
                  <button className="mt-4 text-primary" onClick={() => edit()}>
                    Add your first client →
                  </button>
                )}
              </div>
            )}
          </div>
          <aside className="admin-detail-rail">
            <section className="admin-panel p-6" aria-label="Selected client details">
              {current ? (
                <>
                  <div className="text-center">
                    {current.avatar_path ? (
                      <ContentPhoto
                        path={current.avatar_path}
                        alt={current.name}
                        className="admin-detail-photo mx-auto"
                      />
                    ) : (
                      <span className="admin-avatar !h-20 !w-20 !text-xl">
                        {initials(current.name)}
                      </span>
                    )}
                    <h2 className="mt-4 text-xl font-medium">{current.name}</h2>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {current.country || "Country not supplied"}
                    </p>
                  </div>
                  <dl className="mt-6 space-y-4 text-[11px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Client source</dt>
                      <dd>{current.source}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Recorded spend</dt>
                      <dd>
                        {clientPaid(current.id, data?.trips ?? []) === null
                          ? "Not recorded"
                          : formatNad(clientPaid(current.id, data?.trips ?? [])!)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Reservations</dt>
                      <dd>{data?.trips.filter((t) => t.client_id === current.id).length ?? 0}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[9px] text-muted-foreground">
                    Spending is the received amount recorded by staff, not a quote or automatic
                    payment feed.
                  </p>
                  <div className="mt-5 space-y-3 border-t border-border pt-5 text-[11px]">
                    {current.email && (
                      <a
                        className="flex items-center gap-2 break-all"
                        href={`mailto:${current.email}`}
                      >
                        <Mail size={14} />
                        {current.email}
                      </a>
                    )}
                    {current.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={14} />
                        {current.phone}
                      </p>
                    )}
                    {current.notes && (
                      <p className="whitespace-pre-wrap text-muted-foreground">{current.notes}</p>
                    )}
                  </div>
                  <button
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[11px] font-medium text-primary-foreground"
                    onClick={() => edit(current)}
                  >
                    Edit client <ArrowUpRight size={13} />
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select a client to see more details.
                </p>
              )}
            </section>
            <section className="admin-panel p-5">
              <h2 className="admin-panel-heading">Client sources</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                How your current clients found Pelican.
              </p>
              {sources.length ? (
                sources.map((s) => (
                  <div key={s.name} className="mt-4">
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span>{s.name}</span>
                      <span>{s.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(s.count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="mt-5 text-xs text-muted-foreground">
                  Sources will appear when clients are added.
                </p>
              )}
            </section>
            <HelpPanel />
          </aside>
        </div>
      </WorkspaceState>
      <Sheet
        open={isOpen}
        onOpenChange={(value) => {
          if (busy || uploading) return;
          if (!value && dirty && !window.confirm("Discard unsaved client changes?")) return;
          setOpen(value);
          if (!value) setDirty(false);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit client" : "New client"}</SheetTitle>
            <SheetDescription>
              Private client information. Only staff can see these details.
            </SheetDescription>
          </SheetHeader>
          <form
            className="admin-form mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy || uploading} className="space-y-4">
              {(
                [
                  ["name", "Full name", 200],
                  ["country", "Country of origin", 100],
                  ["email", "Email", 255],
                  ["phone", "Phone", 50],
                ] as const
              ).map(([key, label, max]) => (
                <label key={key}>
                  {label}
                  <input
                    type={key === "email" ? "email" : "text"}
                    required={key === "name"}
                    maxLength={max}
                    value={form[key]}
                    onChange={(e) => change({ [key]: e.target.value })}
                  />
                </label>
              ))}
              <label>
                Client source
                <AppSelect
                  value={form.source}
                  onChange={(e) => change({ source: e.target.value as ClientInput["source"] })}
                >
                  {clientSources.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </AppSelect>
              </label>
              <label>
                Private notes
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={form.notes}
                  onChange={(e) => change({ notes: e.target.value })}
                />
              </label>
              <PhotoUpload
                userId={userId}
                path={form.avatar_path}
                onChange={(path) => change({ avatar_path: path })}
                onBusy={setUploading}
              />
              {form.avatar_path && (
                <Button variant="ghost" type="button" onClick={() => change({ avatar_path: null })}>
                  Remove profile photo
                </Button>
              )}
              {editing && (
                <label className="!flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="!m-0 !w-auto"
                    checked={form.archived}
                    onChange={(e) => change({ archived: e.target.checked })}
                  />
                  Archive this client (keep reservations)
                </label>
              )}
              <Button className="w-full" type="submit">
                {busy ? "Saving…" : "Save client"}
              </Button>
            </fieldset>
            <p role="status" className="text-xs">
              {message}
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
