import { expect, it, vi } from "vitest";
import { checkTravellerSession } from "../lib/traveller-session";
it("returns verified results and bounds a stalled sign-in check", async () => {
  vi.useFakeTimers();
  try {
    expect(await checkTravellerSession(async () => ({ user: "verified" }))).toEqual({
      user: "verified",
    });
    expect(vi.getTimerCount()).toBe(0);
    const pending = checkTravellerSession(() => new Promise(() => {}));
    const assertion = expect(pending).rejects.toThrow("verification timed out");
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
