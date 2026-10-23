const LOCAL_KEY = "pelican-staff-trusted-device";
const SESSION_KEY = "pelican-staff-verified-session";
export const TRUSTED_DEVICE_DAYS = 30;
export const TRUSTED_DEVICE_MS = TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000;

type TrustRecord = { userId: string; expiresAt: number };

function storage(name: "localStorage" | "sessionStorage"): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window[name];
  } catch {
    return undefined;
  }
}

function readRecord(store: Storage | undefined, key: string): TrustRecord | null {
  if (!store) return null;
  try {
    const value = JSON.parse(store.getItem(key) ?? "null") as Partial<TrustRecord> | null;
    return value && typeof value.userId === "string" && typeof value.expiresAt === "number"
      ? { userId: value.userId, expiresAt: value.expiresAt }
      : null;
  } catch {
    store.removeItem(key);
    return null;
  }
}

export function trustStaffDevice(userId: string, remember: boolean, now = Date.now()) {
  const session = storage("sessionStorage");
  const local = storage("localStorage");
  const sessionRecord: TrustRecord = {
    userId,
    expiresAt: remember ? now + TRUSTED_DEVICE_MS : Number.MAX_SAFE_INTEGER,
  };
  session?.setItem(SESSION_KEY, JSON.stringify(sessionRecord));
  if (remember) {
    local?.setItem(
      LOCAL_KEY,
      JSON.stringify({ userId, expiresAt: now + TRUSTED_DEVICE_MS } satisfies TrustRecord),
    );
  } else {
    local?.removeItem(LOCAL_KEY);
  }
}

export function isStaffDeviceTrusted(userId: string, now = Date.now()) {
  const sessionRecord = readRecord(storage("sessionStorage"), SESSION_KEY);
  if (sessionRecord?.userId === userId && sessionRecord.expiresAt > now) return true;

  const local = storage("localStorage");
  const trusted = readRecord(local, LOCAL_KEY);
  if (!trusted || trusted.userId !== userId || trusted.expiresAt <= now) {
    local?.removeItem(LOCAL_KEY);
    return false;
  }
  return true;
}

export function trustedStaffDeviceExpiry(userId: string, now = Date.now()) {
  const trusted = readRecord(storage("localStorage"), LOCAL_KEY);
  return trusted?.userId === userId && trusted.expiresAt > now ? trusted.expiresAt : null;
}

export function clearStaffDeviceTrust() {
  storage("localStorage")?.removeItem(LOCAL_KEY);
  storage("sessionStorage")?.removeItem(SESSION_KEY);
}
