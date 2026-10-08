// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111";
const request = "22222222-2222-4222-8222-222222222222";
const payload = {
  request_id: request,
  name: "Test traveller",
  email: "test@example.com",
  brief: "Etosha preference",
  contact_preference: "Email",
};
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    insert into auth.users values ('${staff}');`);
  await db.exec(
    readFileSync(
      new URL("../../supabase/migrations/202610080001_enquiry_core.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(`insert into public.user_roles(user_id,role) values ('${staff}','staff')`);
}, 30000);
afterAll(() => db.close());
describe.sequential("Enquiry database", () => {
  it("accepts validated submissions once and rejects changed retries", async () => {
    await db.exec("set role service_role");
    const first = await db.query("select public.submit_enquiry($1::jsonb,$2) as id", [
      JSON.stringify(payload),
      "a".repeat(64),
    ]);
    const retry = await db.query("select public.submit_enquiry($1::jsonb,$2) as id", [
      JSON.stringify(payload),
      "a".repeat(64),
    ]);
    expect(retry.rows).toEqual(first.rows);
    await expect(
      db.query("select public.submit_enquiry($1::jsonb,$2)", [
        JSON.stringify({ ...payload, brief: "Changed" }),
        "a".repeat(64),
      ]),
    ).rejects.toThrow("Request changed");
    await db.exec("reset role");
    expect(
      (await db.query<{ count: number }>("select count(*)::int as count from enquiries")).rows[0]
        ?.count,
    ).toBe(1);
  });
  it("denies anonymous reads and direct writes", async () => {
    await db.exec("set role anon");
    await expect(db.query("select * from enquiries")).rejects.toThrow();
    await expect(
      db.query("insert into enquiries(name,brief) values ('bad','bad')"),
    ).rejects.toThrow();
    await db.exec("reset role");
  });
  it("hides enquiries from non-staff and audits allowed staff updates", async () => {
    await db.exec("set role authenticated");
    expect((await db.query("select * from enquiries")).rows).toEqual([]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [staff]);
    expect((await db.query("select * from enquiries")).rows).toHaveLength(1);
    await db.query("update enquiries set status = 'contacted'");
    expect((await db.query("select * from enquiry_events")).rows).toHaveLength(1);
    await expect(db.query("update enquiries set email = 'changed@example.com'")).rejects.toThrow();
    await db.exec("reset role");
  });
  it("limits repeated new submissions and rejects invalid payloads", async () => {
    await db.exec("set role service_role");
    await expect(
      db.query("select public.submit_enquiry($1::jsonb,$2)", [
        JSON.stringify({ ...payload, name: "" }),
        "a".repeat(64),
      ]),
    ).rejects.toThrow("Invalid enquiry");
    for (let i = 0; i < 10; i++)
      await db.query("select public.submit_enquiry($1::jsonb,$2)", [
        JSON.stringify({ ...payload, request_id: crypto.randomUUID() }),
        "b".repeat(64),
      ]);
    await expect(
      db.query("select public.submit_enquiry($1::jsonb,$2)", [
        JSON.stringify({ ...payload, request_id: crypto.randomUUID() }),
        "b".repeat(64),
      ]),
    ).rejects.toThrow("Rate limit");
    await db.exec("reset role");
  });
});
