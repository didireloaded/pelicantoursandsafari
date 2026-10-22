// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111",
  traveller = "22222222-2222-4222-8222-222222222222",
  client = "33333333-3333-4333-8333-333333333333",
  trip = "44444444-4444-4444-8444-444444444444";
const fields = {
  name: "Test guest",
  country: "Namibia",
  email: "test@example.com",
  phone: "",
  source: "Referral",
  notes: "Private",
  avatar_path: null,
  archived: false,
};
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true),'email','staff@example.com')$$;grant usage on schema auth to authenticated;create table auth.mfa_factors(id uuid,user_id uuid,status text);create schema storage;create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;insert into auth.users values('${staff}','staff@example.com'),('${traveller}','traveller@example.com');`,
  );
  for (const path of [
    "supabase/migrations/202610080001_enquiry_core.sql",
    "supabase/migrations/202610120001_trip_maps.sql",
    "supabase/migrations/202610120003_ai_itinerary_drafts.sql",
    "drizzle/migrations/0003_client_admin_content.sql",
    "drizzle/migrations/0004_private_admin_workspace.sql",
  ])
    await db.exec(readFileSync(path, "utf8"));
  await db.exec(`insert into user_roles(user_id,role) values('${staff}','staff')`);
}, 30000);
afterAll(() => db.close());
async function login(id: string = "", aal = "aal1", role = id ? "authenticated" : "anon") {
  await db.exec("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.aal',$2,false)",
    [id, aal],
  );
  await db.exec(`set role ${role}`);
}
const save = (rev: number) =>
  db.query("select save_admin_client($1,$2,$3::jsonb)", [client, rev, JSON.stringify(fields)]);
it("protects clients with staff MFA and optimistic revisions", async () => {
  await login(traveller);
  await expect(save(0)).rejects.toThrow(/Staff/);
  await login(staff);
  await expect(save(0)).rejects.toThrow(/Staff/);
  await login(staff, "aal2");
  await save(0);
  await expect(save(0)).rejects.toThrow(/changed/);
  await save(1);
  await expect(db.exec("update clients set name='overwrite'")).rejects.toThrow();
  await login(traveller);
  expect((await db.query("select * from clients")).rows).toHaveLength(0);
  await login();
  await expect(db.query("select * from clients")).rejects.toThrow();
});
it("keeps offline reservations private and prevents stale or direct financial writes", async () => {
  await login(staff, "aal2");
  const booking = {
    client_id: client,
    traveller_id: null,
    title: "Etosha journey",
    starts_on: "2026-11-01",
    status: "confirmed",
    stops: [{ destination: "etosha", nights: 2 }],
    total_nad: 1000,
    paid_nad: 100,
  };
  const result = await db.query<{ value: { updated_at: string } }>(
    "select save_admin_trip($1,null,$2::jsonb) as value",
    [trip, JSON.stringify(booking)],
  );
  const version = result.rows[0]!.value.updated_at;
  await expect(
    db.query("select save_admin_trip($1,null,$2::jsonb)", [trip, JSON.stringify(booking)]),
  ).rejects.toThrow(/changed/);
  await db.query("select save_admin_trip($1,$2,$3::jsonb)", [
    trip,
    version,
    JSON.stringify({ ...booking, paid_nad: 200 }),
  ]);
  await expect(db.exec("update trips set paid_nad=900")).rejects.toThrow();
  await login(traveller);
  expect((await db.query("select * from trips")).rows).toHaveLength(0);
  await login(staff);
  expect((await db.query("select * from trips")).rows).toHaveLength(0);
});
it("limits analytics writes to service and presence to verified current staff", async () => {
  await login(traveller);
  await expect(db.query("select touch_staff_presence()")).rejects.toThrow(/Staff/);
  await expect(db.query("select record_page_view('/',repeat('a',64))")).rejects.toThrow();
  await login(staff, "aal2");
  await db.query("select touch_staff_presence()");
  expect(
    (await db.query<{ user_id: string }>("select * from staff_presence")).rows[0]!.user_id,
  ).toBe(staff);
  await login();
  await expect(db.query("select * from staff_presence")).rejects.toThrow();
  await login("", "aal1", "service_role");
  for (let i = 0; i < 122; i++) await db.query("select record_page_view('/',repeat('a',64))");
  await login(staff, "aal2");
  expect(
    Number(
      (await db.query<{ views: string }>("select views from site_daily_views")).rows[0]!.views,
    ),
  ).toBe(120);
});
