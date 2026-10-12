import { readApprovedPackages } from "@/lib/safari-package";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Public approved content only; cached across discovery, package and trust surfaces. */
export function useApprovedTravelDetails() {
  const query = useQuery({
    queryKey: ["approved-travel-details"],
    queryFn: async ({ signal }) => {
      const result = await supabase.from("travel_details").select("*")
        .eq("approved", true).order("updated_at", { ascending: false })
        .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(10000)]));
      if (result.error) throw new Error("Approved information is unavailable.");
      return result.data ?? [];
    },
    staleTime: 60_000,
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
