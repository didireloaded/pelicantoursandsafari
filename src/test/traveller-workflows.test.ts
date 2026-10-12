// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { parseShortlist } from "../lib/shortlist";
import { matchSafaris } from "../lib/safari-match";
import { planningSearch } from "../lib/safari-discovery";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111";
const owner = "22222222-2222-4222-8222-222222222222";
const other = "33333333-3333-4333-8333-333333333333";
let proposal: string;
let version: string;
const details = {
  itinerary: "Day 1: Windhoek; overnight to confirm with supplier.",
  accommodation: "Verified supplier booking details",
  inclusions: "Guiding",
  exclusions: "Flights",
  currency: "NAD",
  total: 1000,
  terms: "Test terms",
  valid_until: "2099-01-01",
};
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;insert into auth.users values('${staff}','staff@example.com'),('${owner}','owner@example.com'),('${other}','other@example.com');`,
  );
  for (const name of ["202610080001_enquiry_core.sql", "202610120002_traveller_workflows.sql"])
    await db.exec(
      readFileSync(new URL("../../supabase/migrations/" + name, import.meta.url), "utf8"),
    );
  await db.exec(
    `insert into user_roles(user_id,role) values('${staff}','staff');insert into enquiries(name,brief) values('Test','Brief');`,
  );
}, 30000);
afterAll(() => db.close());
async function login(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
describe.sequential("Traveller workflow permissions", () => {
  it("restricts assignments and audits staff follow-up changes", async () => {
    await login(staff);
    await expect(db.query(`update enquiries set assigned_to='${owner}'`)).rejects.toThrow(
      "Assignee must be staff",
    );
    await db.query(`update enquiries set assigned_to='${staff}',follow_up_on='2026-10-12'`);
    const events = await db.query<{ next_assignee: string; next_follow_up: string }>(
      "select next_assignee,next_follow_up::text from enquiry_events",
    );
    expect(events.rows[0]?.next_assignee).toBe(staff);
    expect(events.rows[0]?.next_follow_up).toBe("2026-10-12");
    expect((await db.query("select * from staff_directory()")).rows).toHaveLength(1);
    await login(owner);
    await expect(db.query("select * from staff_directory()")).rejects.toThrow(
      "Staff access required",
    );
    expect((await db.query("select * from enquiries")).rows).toHaveLength(0);
  });
  it("publishes immutable versions with stale-version protection", async () => {
    await login(staff);
    proposal = (
      await db.query<{ id: string }>(
        `insert into proposals(traveller_id,title) values('${owner}','Test proposal') returning id`,
      )
    ).rows[0]!.id;
    version = (
      await db.query<{ id: string }>("select publish_proposal($1,0,$2::jsonb) as id", [
        proposal,
        JSON.stringify(details),
      ])
    ).rows[0]!.id;
    await expect(
      db.query("select publish_proposal($1,0,$2::jsonb)", [proposal, JSON.stringify(details)]),
    ).rejects.toThrow("Proposal changed");
    await expect(db.query("update proposal_versions set total=1")).rejects.toThrow();
    await expect(db.query("delete from proposal_versions")).rejects.toThrow();
    await expect(
      db.query("select publish_proposal($1,1,$2::jsonb)", [
        proposal,
        JSON.stringify({ ...details, total: -1 }),
      ]),
    ).rejects.toThrow();
  });
  it("isolates proposals and change requests to the assigned traveller", async () => {
    await login(other);
    expect((await db.query("select * from proposals")).rows).toHaveLength(0);
    expect((await db.query("select * from proposal_versions")).rows).toHaveLength(0);
    await expect(
      db.query(
        `insert into proposal_requests(version_id,traveller_id,message) values($1,'${other}','Change')`,
        [version],
      ),
    ).rejects.toThrow();
    await expect(
      db.query("select publish_proposal($1,1,$2::jsonb)", [proposal, JSON.stringify(details)]),
    ).rejects.toThrow("Staff access required");
    await login(owner);
    expect((await db.query("select * from proposal_versions")).rows).toHaveLength(1);
    await db.query(
      `insert into proposal_requests(version_id,traveller_id,message) values($1,'${owner}','Please change day one')`,
      [version],
    );
    await expect(
      db.query(
        `insert into proposal_requests(version_id,traveller_id,message) values($1,'${other}','Spoof')`,
        [version],
      ),
    ).rejects.toThrow();
    await login(staff);
    expect((await db.query("select * from proposal_requests")).rows).toHaveLength(1);
    await db.exec("reset role;set role anon");
    await expect(db.query("select * from proposal_versions")).rejects.toThrow();
  });
  it("limits repeated traveller change requests", async () => {
    await login(owner);
    for (let i = 0; i < 9; i++)
      await db.query(
        "insert into proposal_requests(version_id,traveller_id,message) values($1,$2,'Another request')",
        [version, owner],
      );
    await expect(
      db.query(
        "insert into proposal_requests(version_id,traveller_id,message) values($1,$2,'Too many')",
        [version, owner],
      ),
    ).rejects.toThrow("Too many requests");
  });
  it("keeps unapproved facts private and permits withdrawal of publication", async () => {
    await login(staff);
    const id = (
      await db.query<{ id: string }>(
        `insert into travel_details(category,title,body,source_url,updated_by) values('guide','Verified guide','A sourced fact','https://example.com','${staff}') returning id`,
      )
    ).rows[0]!.id;
    await db.exec("reset role;set role anon");
    expect((await db.query("select * from travel_details")).rows).toHaveLength(0);
    await login(staff);
    await db.query("update travel_details set approved=true where id=$1", [id]);
    await db.exec("reset role;set role anon");
    expect((await db.query("select * from travel_details")).rows).toHaveLength(1);
    await expect(
      db.query(
        "insert into travel_details(category,title,body,source_url,updated_by) values('guide','Fake','Fake','https://example.com',$1)",
        [other],
      ),
    ).rejects.toThrow();
    await login(staff);
    await db.query("update travel_details set approved=false where id=$1", [id]);
    await db.exec("reset role;set role anon");
    expect((await db.query("select * from travel_details")).rows).toHaveLength(0);
  });
});
it("validates shared catalogue choices without accepting arbitrary links", () => {
  expect(
    parseShortlist(
      JSON.stringify([
        { kind: "safari", slug: "big-five-etosha" },
        { kind: "safari", slug: "big-five-etosha" },
        { kind: "stay", slug: "https://evil.example" },
        { kind: "admin", slug: "windhoek-city-tour" },
      ]),
    ),
  ).toEqual([{ kind: "safari", slug: "big-five-etosha" }]);
  expect(parseShortlist("x".repeat(5000))).toEqual([]);
});
it("matches verified interests and bounds shared planning preferences", () => {
  expect(matchSafaris(["City"]).map((x) => x.safari.slug)).toEqual(["windhoek-city-tour"]);
  const parsed = JSON.parse(
    planningSearch({
      preferences: JSON.stringify({
        days: "999",
        budget: "-100",
        style: "Invented",
        interests: ["City", "Invented"],
      }),
    }).preferences!,
  );
  expect(parsed).toEqual({
    days: "",
    budget: "",
    style: "Open to suggestions",
    interests: ["City"],
  });
  expect(planningSearch({ preferences: "null" })).toEqual({});
});
