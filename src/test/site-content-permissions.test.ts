// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, expect, it } from "vitest";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111",
  traveller = "22222222-2222-4222-8222-222222222222",
  id = "33333333-3333-4333-8333-333333333333";
const draft = {
  title: "Etosha weekend",
  summary: "Approved package",
  description: "A verified journey",
  destinations: ["etosha"],
  image: "rhino",
  coverPath: null,
  coverAlt: "",
  interests: ["Wildlife"],
  details: {
    durationDays: null,
    days: [],
    rates: [],
    inclusions: [],
    exclusions: [],
    conversions: [],
  },
};
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;insert into auth.users values('${staff}','staff@example.com'),('${traveller}','traveller@example.com');create table auth.mfa_factors(id uuid,user_id uuid,status text);create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('aal',coalesce(nullif(current_setting('request.jwt.claim.aal',true),''),'aal1')) $$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;`,
  );
  for (const path of [
    "../../supabase/migrations/202610080001_enquiry_core.sql",
    "../../drizzle/migrations/0003_client_admin_content.sql",
  ])
    await db.exec(readFileSync(new URL(path, import.meta.url), "utf8"));
  await db.exec(`insert into user_roles(user_id,role) values('${staff}','staff');`);
}, 30000);
afterAll(() => db.close());
async function login(user?: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? ""]);
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.aal',$1,false)", [
    user === staff ? "aal2" : "aal1",
  ]);
}
async function save(revision: number, action: string, data = draft) {
  return db.query("select save_site_content($1,'package',$2,$3,$4::jsonb) as content", [
    id,
    revision,
    action,
    JSON.stringify(data),
  ]);
}
it("keeps drafts private, publishes atomically, protects conflicts and recovers history", async () => {
  await login(traveller);
  await expect(save(0, "publish")).rejects.toThrow(/Staff/);
  await login(staff);
  await save(0, "save");
  await login();
  expect((await db.query("select * from published_site_content('package')")).rows).toHaveLength(0);
  await expect(db.query("select * from site_content")).rejects.toThrow();
  await login(staff);
  await save(1, "publish");
  await save(2, "save", { ...draft, title: "Private unreleased change" });
  await login();
  const publicRows = (
    await db.query<{ data: typeof draft }>("select * from published_site_content('package')")
  ).rows;
  expect(publicRows).toHaveLength(1);
  expect(publicRows[0]!.data.title).toBe("Etosha weekend");
  expect(JSON.stringify(publicRows)).not.toContain("Private unreleased");
  await login(traveller);
  expect((await db.query("select * from site_content")).rows).toHaveLength(0);
  expect((await db.query("select * from site_content_history")).rows).toHaveLength(0);
  await expect(save(3, "unpublish")).rejects.toThrow(/Staff/);
  await login(staff);
  await expect(save(2, "publish")).rejects.toThrow(/changed/);
  await expect(db.query("update site_content set published=draft")).rejects.toThrow();
  await save(3, "unpublish");
  expect((await db.query("select * from site_content_history")).rows).toHaveLength(4);
  await login();
  expect((await db.query("select * from published_site_content('package')")).rows).toHaveLength(0);
});
it("allows only staff uploads and only published media reads", async () => {
  const path = `${staff}/44444444-4444-4444-8444-444444444444.webp`;
  await login(traveller);
  await expect(
    db.query(
      "insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),'site-media',$1)",
      [path],
    ),
  ).rejects.toThrow();
  await login(staff);
  await db.query(
    "insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),'site-media',$1)",
    [path],
  );
  await login();
  expect((await db.query("select * from storage.objects")).rows).toHaveLength(0);
  await login(staff);
  const photo = {
    destination: "etosha",
    path,
    alt: "Rhino at a waterhole",
    caption: "",
    position: 0,
  };
  await db.query(
    "select save_site_content('55555555-5555-4555-8555-555555555555','photo',0,'publish',$1::jsonb)",
    [JSON.stringify(photo)],
  );
  await login();
  expect((await db.query("select * from storage.objects")).rows).toHaveLength(1);
  await login(staff);
  await db.query(
    "select save_site_content('55555555-5555-4555-8555-555555555555','photo',1,'unpublish',$1::jsonb)",
    [JSON.stringify(photo)],
  );
  await login();
  expect((await db.query("select * from storage.objects")).rows).toHaveLength(0);
});

it("requires an authenticator challenge for staff who enrolled MFA", async () => {
  await login(staff);
  await db.exec("select set_config('request.jwt.claim.aal','aal1',false)");
  expect(
    (await db.query<{ allowed: boolean }>("select can_manage_site() as allowed")).rows[0]!.allowed,
  ).toBe(false);
  await expect(save(4, "publish")).rejects.toThrow(/Staff/);
  await db.exec("select set_config('request.jwt.claim.aal','aal2',false)");
  expect(
    (await db.query<{ allowed: boolean }>("select can_manage_site() as allowed")).rows[0]!.allowed,
  ).toBe(true);
});
