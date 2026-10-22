// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  guest = "33333333-3333-4333-8333-333333333333";
const ownPhoto = `${staff}/44444444-4444-4444-8444-444444444444.webp`,
  otherPhoto = `${other}/55555555-5555-4555-8555-555555555555.webp`;
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;grant usage on schema auth to authenticated;create schema storage;create table storage.objects(bucket_id text,name text);insert into auth.users values('${staff}'),('${other}'),('${guest}');insert into storage.objects values('site-media','${ownPhoto}'),('site-media','${otherPhoto}');`,
  );
  await db.exec(readFileSync("supabase/migrations/202610080001_enquiry_core.sql", "utf8"));
  await db.exec(
    readFileSync("drizzle/migrations/0003_client_admin_content.sql", "utf8").split(
      "-- Client-managed content.",
    )[0]!,
  );
  await db.exec(readFileSync("drizzle/migrations/0009_staff_profiles.sql", "utf8"));
  await db.exec(
    `insert into user_roles(user_id,role) values('${staff}','staff'),('${other}','staff');`,
  );
}, 30000);
afterAll(() => db.close());
async function login(id: string, aal = "aal2") {
  await db.exec(`reset role;set role authenticated;`);
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.aal',$2,false)",
    [id, aal],
  );
}
it("restricts private profile reads and writes to verified staff and always saves the caller's own profile", async () => {
  await login(guest);
  await expect(db.query("select save_staff_profile(0,'Guest',null)")).rejects.toThrow(/Staff/);
  expect((await db.query("select * from staff_profiles")).rows).toHaveLength(0);
  await login(staff, "aal1");
  await expect(db.query("select save_staff_profile(0,'Staff',null)")).rejects.toThrow(/Staff/);
  await login(staff);
  for (const path of [
    otherPhoto,
    `${staff}/66666666-6666-4666-8666-666666666666.webp`,
    "https://example.com/photo.jpg",
  ])
    await expect(db.query("select save_staff_profile(0,'Staff',$1)", [path])).rejects.toThrow(
      /own profile photo/,
    );
  const saved = (
    await db.query<{ profile: { user_id: string; revision: number } }>(
      "select save_staff_profile(0,'Staff member',$1) as profile",
      [ownPhoto],
    )
  ).rows[0]!.profile;
  expect(saved.user_id).toBe(staff);
  expect(saved.revision).toBe(1);
  await expect(db.query("select save_staff_profile(0,'Overwrite',null)")).rejects.toThrow(
    /changed/,
  );
  await expect(db.query("update staff_profiles set avatar_path=null")).rejects.toThrow();
  await login(other);
  expect((await db.query("select * from staff_profiles")).rows).toHaveLength(1);
  await db.query("select save_staff_profile(0,'Other member',null)");
  expect(
    (
      await db.query<{ name: string }>(
        "select display_name as name from staff_profiles where user_id=$1",
        [staff],
      )
    ).rows[0]!.name,
  ).toBe("Staff member");
  await login(staff);
  await db.query("select save_staff_profile(1,'Staff member',null)");
  expect(
    (
      await db.query<{ path: string | null }>(
        "select avatar_path as path from staff_profiles where user_id=$1",
        [staff],
      )
    ).rows[0]!.path,
  ).toBeNull();
  await db.exec("reset role;set role anon");
  await expect(db.query("select * from staff_profiles")).rejects.toThrow();
  await expect(db.query("select save_staff_profile(0,'Guest',null)")).rejects.toThrow();
});
