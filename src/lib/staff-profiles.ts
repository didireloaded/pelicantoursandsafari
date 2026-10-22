import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useStaffProfiles(enabled: boolean) {
  return useQuery({
    queryKey: ["staff-profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("user_id,display_name,avatar_path,revision,updated_at")
        .abortSignal(AbortSignal.timeout(10000));
      if (error) throw new Error("Staff profiles could not be loaded.");
      return data ?? [];
    },
    staleTime: 15000,
    refetchInterval: 60000,
    retry: 1,
  });
}
