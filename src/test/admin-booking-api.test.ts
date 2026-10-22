import { expect, it, vi } from "vitest";
import { blankBooking } from "@/lib/admin-workspace";

const { rpc, abortSignal } = vi.hoisted(() => ({
  rpc: vi.fn(),
  abortSignal: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

import { saveBooking } from "@/lib/admin-workspace-api";

it("preserves a null concurrency timestamp for new reservations and the timestamp for updates", async () => {
  abortSignal.mockResolvedValue({ data: { id: "saved" }, error: null });
  rpc.mockReturnValue({ abortSignal });
  const id = "11111111-1111-4111-8111-111111111111";
  const value = { ...blankBooking(), client_id: id, title: "Test reservation" };
  await saveBooking(id, null, value);
  expect(rpc).toHaveBeenLastCalledWith("save_admin_trip", {
    _id: id, _updated_at: null, _data: value,
  });
  const timestamp = "2026-10-22T10:00:00Z";
  await saveBooking(id, timestamp, value);
  expect(rpc).toHaveBeenLastCalledWith("save_admin_trip", {
    _id: id, _updated_at: timestamp, _data: value,
  });
});