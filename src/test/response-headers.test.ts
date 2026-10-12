import { expect, it } from "vitest";
import { secureResponse } from "../lib/response-headers";
it("preserves status/body while preventing shared HTML caching and permitting the editor", async () => {
  const response = secureResponse(new Response("private", { status: 401, headers: { "content-type": "text/html", "cache-control": "public" } }));
  expect(response.status).toBe(401);
  expect(await response.text()).toBe("private");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("content-security-policy")).toContain("https://lovable.dev");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
});
