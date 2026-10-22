// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Lovable-only AI credentials", () => {
  for (const path of [
    "src/lib/admin-help.functions.ts",
    "supabase/functions/plan-safari/index.ts",
    "supabase/functions/draft-itinerary/index.ts",
  ]) {
    it(`${path} reads only the Lovable AI credential`, () => {
      const source = readFileSync(path, "utf8");
      expect(source).toContain('gatewayKey: ');
      expect(source).toContain('"LOVABLE_API_KEY"');
      expect(source).not.toContain("GOOGLE_AI_STUDIO_API_KEY");
      expect(source).not.toContain("generativelanguage.googleapis.com");
    });
  }
});