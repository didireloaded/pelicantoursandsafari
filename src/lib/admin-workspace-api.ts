import { useQuery } from "@tanstack/react-query";
import { useAdminSampleMode } from "./admin-sample-mode";
import { sampleWorkspace } from "./admin-sample-data";
import { supabase } from "@/integrations/supabase/client";
import {
  addDays,
  dayUtc,
  clientSchema,
  bookingSchema,
  type Client,
  type ClientInput,
  type AdminTrip,
  type BookingInput,
  type Lead,
  type Visit,
  type Workspace,
} from "./admin-workspace";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
async function allRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await page(offset, offset + 499);
    if (result.error)
      throw new Error("Workspace could not be loaded. Check your sign-in and retry.");
    const next = result.data ?? [];
    rows.push(...next);
    if (next.length < 500) return rows;
  }
}
export async function loadWorkspace(
  client: SupabaseClient<Database> = supabase,
): Promise<Workspace> {
  const [clients, trips, leads, visits] = await Promise.all([
    allRows((a, b) =>
      client
        .from("clients")
        .select("*")
        .order("id")
        .range(a, b)
        .abortSignal(AbortSignal.timeout(10000)),
    ),
    allRows((a, b) =>
      client
        .from("trips")
        .select("*")
        .order("id")
        .range(a, b)
        .abortSignal(AbortSignal.timeout(10000)),
    ),
    allRows((a, b) =>
      client
        .from("enquiries")
        .select(
          "id,name,status,created_at,follow_up_on,residence,booking_ref,confirmed_starts_on,confirmed_ends_on,email,phone,brief,trip_code",
        )
        .order("id")
        .range(a, b)
        .abortSignal(AbortSignal.timeout(10000)),
    ),
    allRows((a, b) =>
      client
        .from("site_daily_views")
        .select("*")
        .gte("day", addDays(dayUtc(), -90))
        .order("day")
        .order("path")
        .range(a, b)
        .abortSignal(AbortSignal.timeout(10000)),
    ),
  ]);
  return {
    clients: clients as Client[],
    trips: trips.map((t) => ({
      ...t,
      total_nad: t.total_nad === null ? null : Number(t.total_nad),
      paid_nad: t.paid_nad === null ? null : Number(t.paid_nad),
    })) as AdminTrip[],
    leads: leads as Lead[],
    visits: visits.map((v) => ({ ...v, views: Number(v.views) })) as Visit[],
  };
}
export function useWorkspace() {
  const sample = useAdminSampleMode();
  const query = useQuery({
    queryKey: ["admin-workspace"],
    queryFn: () => loadWorkspace(),
    enabled: !sample,
    staleTime: 15000,
    refetchInterval: sample ? false : 60000,
    retry: 1,
  });
  return sample
    ? { ...query, data: sampleWorkspace(), isPending: false, isError: false }
    : query;
}
export async function saveClient(id: string, revision: number, value: ClientInput) {
  const payload = clientSchema.parse(value);
  const { data, error } = await supabase
    .rpc("save_admin_client", { _id: id, _revision: revision, _data: payload })
    .abortSignal(AbortSignal.timeout(15000));
  if (error || !data)
    throw new Error(
      error?.message.includes("changed")
        ? "Another staff member changed this client. Reload before saving; your edits are retained."
        : "Client save not confirmed. Check the saved version before retrying; your edits are retained.",
    );
  return data as unknown as Client;
}
export async function saveBooking(id: string, updatedAt: string | null, value: BookingInput) {
  const payload = bookingSchema.parse(value);
  const { data, error } = await supabase
    // Generated RPC types omit SQL argument nullability; creation requires a literal null.
    .rpc("save_admin_trip", {
      _id: id,
      _updated_at: updatedAt,
      _data: payload,
    } as Database["public"]["Functions"]["save_admin_trip"]["Args"])
    .abortSignal(AbortSignal.timeout(15000));
  if (error || !data)
    throw new Error(
      error?.message.includes("changed")
        ? "Another staff member changed this reservation. Reload before saving."
        : "Reservation save not confirmed. Check the saved version before retrying.",
    );
  return data as unknown as AdminTrip;
}
