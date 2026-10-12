/** Preserve Lovable's editor embedding while restricting unrelated frames. */
export function secureResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://lovable.dev https://gptengineer.app");
  // HTML can contain authentication/planning state; never cache it across users.
  if (headers.get("content-type")?.includes("text/html")) headers.set("Cache-Control", "private, no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
