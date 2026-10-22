import { AppSelect } from "@/components/ui/app-select";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { BarChart3, MousePointerClick, Mail, Wallet } from "lucide-react";
import { useWorkspace } from "@/lib/admin-workspace-api";
import { dayUtc, addDays, periodSummary } from "@/lib/admin-workspace";
import { formatNad } from "@/lib/safari-package";
import { WorkspaceState } from "./workspace-state";
const colors = [
  "var(--primary)",
  "var(--clay)",
  "color-mix(in oklch,var(--primary) 65%,var(--card))",
  "color-mix(in oklch,var(--clay) 55%,var(--card))",
  "var(--muted-foreground)",
];
export function Analytics() {
  const query = useWorkspace();
  const data = query.data;
  const [period, setPeriod] = useState(30);
  const today = dayUtc();
  const summary = data ? periodSummary(data, period, today) : null;
  const firstMeasuredDay =
    data?.visits.reduce<string | null>(
      (first, visit) => (!first || visit.day < first ? visit.day : first),
      null,
    ) ?? null;
  const series = useMemo(
    () =>
      Array.from({ length: period }, (_, index) => {
        const day = addDays(today, index + 1 - period);
        const trips =
          data?.trips.filter((t) => t.status === "confirmed" && t.starts_on === day) ?? [];
        return {
          day: day.slice(5),
          views:
            firstMeasuredDay && day >= firstMeasuredDay
              ? (data?.visits.filter((v) => v.day === day).reduce((sum, v) => sum + v.views, 0) ??
                0)
              : null,
          leads: data?.leads.filter((l) => l.created_at.startsWith(day)).length ?? 0,
          value:
            trips.length && !trips.some((t) => t.total_nad !== null)
              ? null
              : trips.reduce((sum, t) => sum + Number(t.total_nad ?? 0), 0),
        };
      }),
    [data, period, today, firstMeasuredDay],
  );
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    data?.clients
      .filter((c) => !c.archived)
      .forEach((c) =>
        counts.set(c.country || "Not supplied", (counts.get(c.country || "Not supplied") ?? 0) + 1),
      );
    return [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);
  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    data?.clients
      .filter((c) => !c.archived)
      .forEach((c) => counts.set(c.source, (counts.get(c.source) ?? 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [data]);
  const start = addDays(today, 1 - period);
  const confirmed =
    data?.trips.filter(
      (t) => t.status === "confirmed" && t.starts_on >= start && t.starts_on <= today,
    ) ?? [];
  const known = confirmed.filter((t) => t.total_nad !== null).length;
  const hasViews = !!data?.visits.length;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">A CLEARER PICTURE</p>
          <h1 className="mt-2">Website & business analytics</h1>
          <p>
            Traffic, enquiries and the journeys behind the numbers. All figures come from recorded
            activity.
          </p>
        </div>
        <label className="admin-pill">
          Period
          <AppSelect
            aria-label="Analytics period"
            className="ml-2 bg-transparent"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </AppSelect>
        </label>
      </div>
      <WorkspaceState
        loading={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        <div className="admin-stats">
          {[
            {
              label: "Page views",
              value: hasViews ? (summary?.views ?? 0) : "—",
              note: hasViews ? "Anonymous views, not unique visitors" : "Awaiting recorded visits",
              Icon: BarChart3,
            },
            {
              label: "Confirmed trip value",
              value: confirmed.length && !known ? "Not recorded" : formatNad(summary?.value ?? 0),
              note: `${known} of ${confirmed.length} departure totals recorded`,
              Icon: Wallet,
            },
            {
              label: "New enquiries",
              value: summary?.leads ?? 0,
              note: "Submitted during this period",
              Icon: Mail,
            },
            {
              label: "Enquiries per 100 views",
              value: summary?.views ? ((summary.leads / summary.views) * 100).toFixed(1) : "—",
              note: "Aggregate engagement ratio, not visitor conversion",
              Icon: MousePointerClick,
            },
          ].map((item) => (
            <div className="admin-panel admin-stat" key={item.label}>
              <p className="admin-stat-label">
                {item.label}
                <item.Icon size={15} />
              </p>
              <p
                className={`admin-stat-value ${typeof item.value === "string" && item.value.length > 12 ? "!text-xl" : ""}`}
              >
                {item.value}
              </p>
              <p className="admin-stat-note">{item.note}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <section className="admin-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="admin-panel-heading">Performance</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Daily page views and submitted enquiries.
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-primary">● Views</span>
                <span className="text-clay">● Enquiries</span>
              </div>
            </div>
            {hasViews || data?.leads.length ? (
              <div
                className="mt-7 h-64"
                role="img"
                aria-label={`Daily page views and enquiries for the last ${period} days`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ left: -22, right: -22, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      yAxisId="views"
                      allowDecimals={false}
                      tick={{ fontSize: 9, fill: "var(--primary)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="leads"
                      orientation="right"
                      allowDecimals={false}
                      tick={{ fontSize: 9, fill: "var(--clay)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 12,
                        borderColor: "var(--border)",
                        background: "var(--card)",
                      }}
                    />
                    <Line
                      yAxisId="views"
                      dataKey="views"
                      name="Views (left axis)"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="leads"
                      dataKey="leads"
                      name="Enquiries (right axis)"
                      stroke="var(--clay)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="admin-empty">
                <BarChart3 size={30} className="mx-auto mb-4 opacity-40" />
                Traffic and enquiry trends will appear as activity is recorded.
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Page views start when measurement is deployed. No historical traffic is invented.
              Privacy opt-outs are respected; these are not unique-person counts.
            </p>
          </section>
          <section className="admin-panel p-6">
            <h2 className="admin-panel-heading">Audience</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Client countries of origin, supplied by staff.
            </p>
            {countries.length ? (
              <>
                <div className="h-44" role="img" aria-label="Client country breakdown">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countries}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={49}
                        outerRadius={68}
                        paddingAngle={3}
                        isAnimationActive={false}
                      >
                        {countries.map((c, i) => (
                          <Cell
                            key={c.name}
                            fill={colors[i % colors.length]}
                            stroke="var(--card)"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 10, background: "var(--card)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-3">
                  {countries.map((c, i) => (
                    <li className="flex items-center justify-between text-xs" key={c.name}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: colors[i % colors.length] }}
                        />
                        {c.name}
                      </span>
                      <span>{c.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="admin-empty">Add client countries to build this view.</p>
            )}
            <p className="mt-5 text-xs text-muted-foreground">
              This describes your client directory, not the location or demographics of every
              website visitor.
            </p>
          </section>
          <section className="admin-panel p-6">
            <h2 className="admin-panel-heading">Sales · confirmed trip value</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              NAD by departure day. Values are agreed totals, not processed payments.
            </p>
            {known ? (
              <div
                className="mt-5 h-52"
                role="img"
                aria-label="Confirmed trip value by departure day"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 9 }}
                      minTickGap={30}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => formatNad(Number(v))}
                      contentStyle={{ fontSize: 11, borderRadius: 10, background: "var(--card)" }}
                    />
                    <Bar
                      dataKey="value"
                      name="Agreed trip total"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="admin-empty">No confirmed trip totals are recorded for this period.</p>
            )}
          </section>
          <section className="admin-panel p-6">
            <h2 className="admin-panel-heading">Client sources</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded origin of current client relationships.
            </p>
            {sources.length ? (
              sources.map(([name, count]) => (
                <div className="admin-row text-xs" key={name}>
                  <span>{name}</span>
                  <strong className="ml-auto font-medium">{count}</strong>
                </div>
              ))
            ) : (
              <p className="admin-empty">Sources will appear as clients are recorded.</p>
            )}
          </section>
        </div>
      </WorkspaceState>
    </>
  );
}
