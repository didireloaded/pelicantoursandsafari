import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStaffDeviceTrust,
  isStaffDeviceTrusted,
  TRUSTED_DEVICE_MS,
  trustStaffDevice,
  trustedStaffDeviceExpiry,
} from "@/lib/trusted-staff-device";

describe("trusted staff device", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("trusts the verified staff account for exactly thirty days", () => {
    const now = Date.UTC(2026, 9, 23);
    trustStaffDevice("staff-1", true, now);

    expect(trustedStaffDeviceExpiry("staff-1", now)).toBe(now + TRUSTED_DEVICE_MS);
    expect(isStaffDeviceTrusted("staff-1", now + TRUSTED_DEVICE_MS - 1)).toBe(true);
    expect(isStaffDeviceTrusted("staff-1", now + TRUSTED_DEVICE_MS)).toBe(false);
    expect(isStaffDeviceTrusted("staff-2", now)).toBe(false);
  });

  it("keeps an untrusted device verified only for the current browser session", () => {
    trustStaffDevice("staff-1", false);
    expect(isStaffDeviceTrusted("staff-1")).toBe(true);

    sessionStorage.clear();
    expect(isStaffDeviceTrusted("staff-1")).toBe(false);
  });

  it("removes both persistent and session trust at sign-out", () => {
    trustStaffDevice("staff-1", true);
    clearStaffDeviceTrust();
    expect(isStaffDeviceTrusted("staff-1")).toBe(false);
  });
});
