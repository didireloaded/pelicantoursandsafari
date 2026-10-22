// Server-only helpers for booking references and lookups (service credentials).
export async function networkHash(salt: string, address: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${address}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function serviceRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend unavailable");
  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: key };
  if (!key.startsWith("sb_secret_")) headers["Authorization"] = `Bearer ${key}`;
  const res = await fetch(new URL(`/rest/v1/rpc/${name}`, url), {
    method: "POST", headers, body: JSON.stringify(args), signal: AbortSignal.timeout(15000),
  });
  const value = await res.json().catch(() => null);
  if (!res.ok) throw new Error(typeof value?.message === "string" ? value.message : `RPC failed [${res.status}]`);
  return value as T;
}
