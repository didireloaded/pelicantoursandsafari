// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { destinations, safaris, safariInterests } from "../lib/pelican";
import * as deployedCatalogue from "../../supabase/functions/_shared/planner-catalogue";
import * as browserPlanner from "../lib/traveller-itinerary";
import * as deployedPlanner from "../../supabase/functions/_shared/traveller-itinerary";

describe("Lovable-only AI credentials", () => {
  it("deploys only the existing approved catalogue facts", () => {
    expect(deployedCatalogue.destinations).toEqual(destinations.map(({ slug, name }) => ({ slug, name })));
    expect(deployedCatalogue.safaris).toEqual(safaris.map(({ slug, name, overview, destinations }) => ({ slug, name, overview, destinations })));
    expect(deployedCatalogue.safariInterests).toEqual(safariInterests);
  });
  it("preserves planner requests and validation when packaged for deployment", () => {
    const input = { destination: "etosha", start: "2099-02-01", end: "2099-02-02", budget: 10000, interests: ["Wildlife"] };
    expect(deployedPlanner.travellerGatewayBody(input)).toEqual(browserPlanner.travellerGatewayBody(input));
    const output = { days: [{ day: 1, safari: "big-five-etosha", interests: ["Wildlife"] }, { day: 2, safari: null, interests: [] }] };
    expect(deployedPlanner.compileTravellerPlan(input, output)).toEqual(browserPlanner.compileTravellerPlan(input, output));
    for (const patch of [{ budget: -1 }, { destination: "unknown" }, { start: "2099-02-30" }, { end: "2099-03-05" }]) {
      expect(deployedPlanner.plannerSchema.safeParse({ ...input, ...patch }).success).toBe(false);
    }
    expect(() => deployedPlanner.compileTravellerPlan(input, { ...output, price: 50 })).toThrow();
  });
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