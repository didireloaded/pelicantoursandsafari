import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AdminSampleModeProvider } from "@/lib/admin-sample-mode";

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc },
}));

import { useWorkspace } from "@/lib/admin-workspace-api";

describe("admin sample mode isolation", () => {
  it("returns fictional workspace records without querying the live database", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <AdminSampleModeProvider enabled>{children}</AdminSampleModeProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    await waitFor(() => expect(result.current.data?.clients).toHaveLength(12));
    expect(result.current.data?.clients.every((client) => client.id.startsWith("sample-"))).toBe(
      true,
    );
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
