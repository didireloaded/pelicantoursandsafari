// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111",
  owner = "22222222-2222-4222-8222-222222222222",
  outsider = "33333333-3333-4333-8333-333333333333";
let trip: { id: string; updated_at: string };
const stops = JSON.stringify([{ destination: "etosha", stay: "mokuti-etosha", nights: 3 }]);
beforeAll(async () => {
  await db.exec(
    `create role anon; create role authenticated; create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;insert into auth.users values('${staff}'),('${owner}'),('${outsider}');`,
  );
  for (const file of ["202610080001_enquiry_core.sql", "202610120001_trip_maps.sql"])
    await db.exec(
      readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8"),
    );
  await db.exec(
    `insert into user_roles(user_id,role) values('${staff}','staff');set role authenticated;set request.jwt.claim.sub='${staff}';`,
  );
  const result = await db.query<{ id: string; updated_at: string }>(
    "insert into trips(traveller_id,title,starts_on,stops) values($1,'Test trip','2026-11-01',$2) returning id,updated_at",
    [owner, stops],
  );
  trip = result.rows[0]!;
}, 30000);
afterAll(() => db.close());
describe.sequential("Private booked trips", () => {
  it("hides drafts, denies traveller writes and exposes only assigned confirmed trips", async () => {
    await db.exec(`set request.jwt.claim.sub='${owner}'`);
    expect((await db.query("select * from trips")).rows).toHaveLength(0);
    await expect(
      db.query(
        "insert into trips(traveller_id,title,starts_on,stops) values($1,'Fake','2026-11-01',$2)",
        [owner, stops],
      ),
    ).rejects.toThrow();
    await db.exec(`set request.jwt.claim.sub='${staff}'`);
    await db.query("update trips set status='confirmed' where id=$1", [trip.id]);
    await db.exec(`set request.jwt.claim.sub='${owner}'`);
    expect((await db.query("select * from trips")).rows).toHaveLength(1);
    expect(
      (await db.query("update trips set status='cancelled' where id=$1 returning id", [trip.id]))
        .rows,
    ).toHaveLength(0);
    await db.exec(`set request.jwt.claim.sub='${outsider}'`);
    expect((await db.query("select * from trips")).rows).toHaveLength(0);
    await db.exec("set role anon");
    await expect(db.query("select * from trips")).rejects.toThrow();
  });
  it("rejects invalid itinerary data and stale concurrent edits", async () => {
    await db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='${staff}'`);
    for (const value of [
      [],
      [{ destination: "unknown", nights: 2 }],
      [{ destination: "etosha", stay: "the-desert-grace", nights: 1 }],
      [{ destination: "etosha", nights: 0 }],
      [{ destination: "etosha" }],
    ])
      await expect(
        db.query("update trips set stops=$1 where id=$2", [JSON.stringify(value), trip.id]),
      ).rejects.toThrow();
    expect(
      (
        await db.query(
          "update trips set title='Stale' where id=$1 and updated_at=$2 returning id",
          [trip.id, trip.updated_at],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("limits routing usage and restricts the quota function to the backend", async () => {
    await expect(
      db.query("select consume_routing_request($1)", ["a".repeat(64)]),
    ).rejects.toThrow();
    await db.exec("reset role;set role service_role");
    for (let i = 0; i < 20; i++)
      await db.query("select consume_routing_request($1)", ["a".repeat(64)]);
    await expect(db.query("select consume_routing_request($1)", ["a".repeat(64)])).rejects.toThrow(
      "Rate limit",
    );
  });
});
