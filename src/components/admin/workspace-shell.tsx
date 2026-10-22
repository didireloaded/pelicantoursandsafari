import { useStaffProfiles } from "@/lib/staff-profiles";
import { AdminSampleModeProvider } from "@/lib/admin-sample-mode";
import { StaffAvatar } from "./staff-avatar";
import { Link, useLocation } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  BarChart3,
  Map,
  Image,
  Mail,
  BookOpen,
  Settings,
  UserRound,
  Menu,
  X,
  ExternalLink,
  Search,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminLinks } from "@/lib/admin-navigation";
const icons = [
  LayoutDashboard, Mail, Users, CalendarDays, ClipboardList, BarChart3,
  Map, Image, BookOpen, Users, UserRound, Settings,
];
export function WorkspaceShell({
  children,
  email,
  ready,
  userId,
}: {
  children: ReactNode;
  email: string;
  userId?: string;
  ready: boolean;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sampleMode, setSampleMode] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = menuButton.current;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? [],
      );
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
  }, [open]);
  useEffect(() => {
    setOpen(false);
    setSearch("");
  }, [location.pathname]);
  const profiles = useStaffProfiles(ready);
  const team = useQuery({
    queryKey: ["staff-presence"],
    enabled: ready,
    queryFn: async () => {
      if (document.visibilityState === "visible") {
        const ping = await supabase.rpc("touch_staff_presence");
        if (ping.error) throw ping.error;
      }
      const rows = await supabase
        .from("staff_presence")
        .select("*")
        .gte("last_seen", new Date(Date.now() - 120000).toISOString())
        .order("display_name")
        .abortSignal(AbortSignal.timeout(10000));
      if (rows.error) throw rows.error;
      return rows.data ?? [];
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    retry: 0,
  });
  const people = (team.data ?? []).map((person) => ({
    ...person,
    ...profiles.data?.find((profile) => profile.user_id === person.user_id),
  }));
  const nav = (
    <>
      {adminLinks.map((item, i) => {
        const Icon = icons[i] ?? BookOpen;
        return (
          <Fragment key={item.to}>
            {(i === 0 || adminLinks[i - 1]?.section !== item.section) && (
              <p className="admin-nav-caption">{item.section}</p>
            )}
            <Link
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "is-current", "aria-current": "page" }}
              className="admin-nav-link"
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
            </Link>
          </Fragment>
        );
      })}
    </>
  );
  const current = adminLinks.find((item) => item.to === location.pathname)?.label ?? "Workspace";
  const ownProfile = profiles.data?.find((person) => person.user_id === userId);
  const name = ownProfile?.display_name || email.split("@")[0] || "Pelican staff";
  const filtered = search.trim()
    ? adminLinks.filter((item) =>
        (item.label + " " + item.description).toLowerCase().includes(search.trim().toLowerCase()),
      )
    : [];
  return (
    <AdminSampleModeProvider enabled={sampleMode}>
    <div className="pelican-admin">
      <aside
        ref={sidebar}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        className={`admin-sidebar ${open ? "is-open" : ""}`}
        aria-label="Administration sidebar"
      >
        <Link to="/admin" className="admin-brand">
          <img src="/pelican-logo.png" alt="" />
          <span>
            Pelican
            <span className="block text-xs font-normal uppercase tracking-[.2em] opacity-60">
              Tours & safaris
            </span>
          </span>
        </Link>
        <nav aria-label="Pelican administration">{nav}</nav>
        <div className="mx-2 my-4 border-t border-border pt-4">
          <button
            type="button"
            role="switch"
            aria-checked={sampleMode}
            onClick={() => setSampleMode((value) => !value)}
            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span><strong className="block font-medium">Sample data</strong><small className="block text-xs text-muted-foreground">Read-only presentation</small></span>
            <span aria-hidden="true" className={`inline-flex h-6 w-11 items-center rounded-full p-1 transition-colors ${sampleMode ? "bg-primary" : "bg-muted"}`}>
              <span className={`h-4 w-4 rounded-full bg-white transition-transform ${sampleMode ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </div>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer" className="admin-nav-link">
            <ExternalLink size={17} />
            View website
          </a>
          <Link to="/admin/profile" className="admin-profile">
            <span className="admin-avatar">
              <StaffAvatar path={ownProfile?.avatar_path ?? null} name={name} />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-xs">{name}</strong>
              <span className="block text-xs text-muted-foreground">Staff account</span>
            </span>
            <ChevronDown size={14} className="ml-auto" />
          </Link>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close navigation"
          className="admin-backdrop"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            ref={menuButton}
            className="admin-mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-team-circles relative">
            <button
              className="flex items-center gap-1"
              aria-label="Recently active staff"
              aria-expanded={teamOpen}
              onClick={() => setTeamOpen(!teamOpen)}
            >
              {people.length ? (
                people.slice(0, 5).map((person) => (
                  <span
                    key={person.user_id}
                    className="admin-avatar admin-team-avatar"
                    title={person.display_name}
                  >
                    <StaffAvatar path={person.avatar_path ?? null} name={person.display_name} />
                  </span>
                ))
              ) : (
                <span className="admin-avatar admin-team-avatar">
                  <StaffAvatar path={ownProfile?.avatar_path ?? null} name={name} />
                </span>
              )}
              <span className="ml-2 hidden text-xs text-muted-foreground xl:block">
                Your team
              </span>
            </button>
            {teamOpen && (
              <div className="admin-team-popover">
                <strong className="text-xs">Recently active team</strong>
                <p className="my-2 text-xs text-muted-foreground">
                  Activity within the last two minutes.
                </p>
                {team.isError ? (
                  <p className="text-xs">Team activity unavailable.</p>
                ) : people.length ? (
                  people.map((person) => (
                    <p className="py-1 text-xs" key={person.user_id}>
                      {person.display_name}
                    </p>
                  ))
                ) : (
                  <p className="text-xs">Your current session</p>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Workspace <span className="mx-2 opacity-40">/</span>
            <span className="font-medium text-foreground">{current}</span>
          </div>
          <div className="admin-search">
            <Search size={16} />
            <input
              aria-label="Find a section"
              placeholder="Find a section…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <div className="admin-search-results">
                {filtered.length ? (
                  filtered.map((item) => (
                    <Link key={item.to} to={item.to}>
                      {item.label}
                      <small>{item.description}</small>
                    </Link>
                  ))
                ) : (
                  <p>No matching sections.</p>
                )}
              </div>
            )}
          </div>
        </header>
        {sampleMode && (
          <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/25 bg-secondary px-4 py-3 text-sm" role="status">
            <span><strong>Sample data is on.</strong> Fictional clients, trips and staff. Changes are disabled. No real records or payments are affected.</span>
            <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setSampleMode(false)}>Return to live data</button>
          </div>
        )}
        <div className="admin-page">{children}</div>
        <footer className="admin-footer">
          Pelican Tours and Safaris <span>Private workspace · Namibia</span>
        </footer>
      </div>
    </div>
    </AdminSampleModeProvider>
  );
}
