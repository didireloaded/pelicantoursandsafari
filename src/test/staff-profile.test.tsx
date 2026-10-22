import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), load: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useBlocker: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ abortSignal: () => ({ maybeSingle: mocks.load }) }) }),
    }),
    rpc: () => ({ abortSignal: mocks.rpc }),
  },
}));
vi.mock("@/components/admin/photo-upload", () => ({
  PhotoUpload: ({ onChange }: { onChange: (path: string) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange("11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.webp")
      }
    >
      Choose profile photo
    </button>
  ),
}));
import { StaffProfile } from "@/components/admin/staff-profile";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function show(verified = true) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <StaffProfile
        userId="11111111-1111-4111-8111-111111111111"
        email="staff@example.com"
        verified={verified}
      />
    </QueryClientProvider>,
  );
}
it("retains a failed profile draft and sends the saved revision on retry", async () => {
  mocks.load.mockResolvedValue({
    data: { display_name: "Staff", avatar_path: null, revision: 2 },
    error: null,
  });
  mocks.rpc.mockResolvedValueOnce({ error: { message: "conflict" } }).mockResolvedValueOnce({
    data: {
      user_id: "11111111-1111-4111-8111-111111111111",
      display_name: "New display name",
      avatar_path: null,
      revision: 3,
      updated_at: "2026-10-22",
    },
    error: null,
  });
  show();
  const input = await screen.findByLabelText("Display name");
  fireEvent.change(input, { target: { value: "New display name" } });
  fireEvent.click(screen.getByRole("button", { name: "Choose profile photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByText(/Save not confirmed/)).toBeVisible();
  expect(input).toHaveValue("New display name");
  expect(screen.getByRole("button", { name: "Remove profile photo" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByText("Profile saved.")).toBeVisible();
  expect(mocks.rpc).toHaveBeenCalledTimes(2);
});
it("does not load or edit a profile before staff MFA verification", () => {
  show(false);
  expect(screen.getByText(/Verify your authenticator/)).toBeVisible();
  expect(screen.queryByLabelText("Display name")).toBeNull();
  expect(mocks.load).not.toHaveBeenCalled();
});
