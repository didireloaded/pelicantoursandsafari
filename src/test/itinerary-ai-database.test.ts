// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111";
const traveller = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;insert into auth.users values('${staff}'),('${traveller}');`,
  );
  for (const file of ["202610080001_enquiry_core.sql", "202610120003_ai_itinerary_drafts.sql"])
    await db.exec(
      readFileSync(new URL("../../supabase/migrations/" + file, import.meta.url), "utf8"),
    );
  await db.exec(`insert into user_roles(user_id,role) values('${staff}','staff');`);
}, 30000);
afterAll(() => db.close());
it("limits spend and restricts quota consumption to staff without storing briefs", async () => {
  await db.exec("set role anon");
  await expect(db.query("select consume_ai_draft_request()")).rejects.toThrow();
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [traveller]);
  await db.exec("set role authenticated");
  await expect(db.query("select consume_ai_draft_request()")).rejects.toThrow(
    "Staff access required",
  );
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [staff]);
  await db.exec("set role authenticated");
  for (let i = 0; i < 10; i++) await db.query("select consume_ai_draft_request()");
  await expect(db.query("select consume_ai_draft_request()")).rejects.toThrow("Draft limit");
  await expect(db.query("select * from private.ai_draft_requests")).rejects.toThrow();
  await db.exec(
    `reset role;update private.ai_draft_requests set created_at=now()-interval '2 hours';insert into private.ai_draft_requests(staff_id,created_at) select '${staff}',now()-interval '2 hours' from generate_series(1,90);set role authenticated;`,
  );
  await expect(db.query("select consume_ai_draft_request()")).rejects.toThrow("Draft limit");
  await db.exec("reset role");
  const columns = await db.query<{ column_name: string }>(
    "select column_name from information_schema.columns where table_schema='private' and table_name='ai_draft_requests'",
  );
  expect(columns.rows.map((c) => c.column_name)).toEqual(["staff_id", "created_at"]);
});
