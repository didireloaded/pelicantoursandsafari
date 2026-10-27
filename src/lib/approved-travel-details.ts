import { readApprovedPackages } from "@/lib/safari-package";
import { useQuery } from "@tanstack/react-query";

export const APPROVED_TRAVEL_DETAILS_STALE_TIME = 5 * 60_000;

/** Public approved content only; cached across discovery, package and trust surfaces. */
export function useApprovedTravelDetails() {
  const query = useQuery({
    queryKey: ["approved-travel-details"],
    queryFn: async ({ signal }) => {
      // Keep the comparatively large database SDK out of the initial public route bundle.
      // Approved details enhance the fixed catalogue and can load after the first render.
      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase.from("travel_details").select("*")
        .eq("approved", true).order("updated_at", { ascending: false })
        .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(10000)]));
      if (result.error) throw new Error("Approved information is unavailable.");
      return result.data ?? [];
    },
    staleTime: APPROVED_TRAVEL_DETAILS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return {
    rows: query.isError ? [] : query.data ?? [],
    loading: query.isPending,
    error: query.isError ? "Approved information is unavailable. Ask Pelican for the latest details." : "",
    reload: () => void query.refetch(),
  };
}

export function approvedSource(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function useApprovedSafariPackages() {
  const query = useApprovedTravelDetails();
  return { packages: readApprovedPackages(query.rows), error: query.error, reload: query.reload };
}
