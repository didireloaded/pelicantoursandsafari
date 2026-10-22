// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
const db = new PGlite();
const ids = Array.from(
  { length: 9 },
  (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);
const owner = ids[0]!,
  staff = ids[1]!,
  traveller = ids[8]!;
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true),'user_metadata',jsonb_build_object('role','admin'))$$;grant usage on schema auth to authenticated;create table auth.mfa_factors(id uuid,user_id uuid,status text);create schema storage;create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert on storage.objects to anon,authenticated;`,
  );
  for (const path of [
    "supabase/migrations/202610080001_enquiry_core.sql",
    "drizzle/migrations/0003_client_admin_content.sql",
    "drizzle/migrations/0007_owner_managed_team.sql",
  ])
    await db.exec(readFileSync(path, "utf8"));
  for (let i = 0; i < ids.length; i++)
    await db.query("insert into auth.users values($1,$2,$3)", [
      ids[i],
      `user${i}@example.com`,
      i === 7 ? null : "2026-10-22T00:00:00Z",
    ]);
  await db.query("insert into user_roles(user_id,role) values($1,'admin'),($2,'staff')", [
    owner,
    staff,
  ]);
}, 30000);
afterAll(() => db.close());
async function login(id = "", aal = "aal1") {
  await db.exec("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.aal',$2,false)",
    [id, aal],
  );
  await db.exec(`set role ${id ? "authenticated" : "anon"}`);
}
const add = (email: string, role = "staff") =>
  db.query("select set_team_member($1,$2::app_role)", [email, role]);
it("requires a real administrator and MFA, regardless of user metadata", async () => {
  await login();
  await expect(db.query("select team_members()")).rejects.toThrow();
  await login(staff, "aal2");
  await expect(
    db.query("insert into user_roles(user_id,role) values($1,'admin')", [staff]),
  ).rejects.toThrow();
  for (const id of [traveller, staff, owner]) {
    await login(id, id === owner ? "aal1" : "aal2");
    await expect(add("user2@example.com")).rejects.toThrow(/administrator/);
    await expect(db.query("select team_members()")).rejects.toThrow(/administrator/);
  }
});
it("lets the owner approve only existing confirmed accounts and protects their own access", async () => {
  await login(owner, "aal2");
  await add(" USER2@EXAMPLE.COM ");
  await add("user3@example.com", "admin");
  await add("user2@example.com");
  await expect(add("user7@example.com")).rejects.toThrow(/verify/);
  await expect(add("missing@example.com")).rejects.toThrow(/verify/);
  await expect(add("user0@example.com", "staff")).rejects.toThrow(/own/);
  await expect(db.query("select remove_team_member($1)", [owner])).rejects.toThrow(/own/);
  const result = await db.query<{ members: { email: string; role: string }[] }>(
    "select team_members() as members",
  );
  expect(result.rows[0]!.members).toHaveLength(4);
  expect(result.rows[0]!.members.find((row) => row.email === "user3@example.com")!.role).toBe(
    "admin",
  );
});
it("enforces five distinct people and immediately revokes removed access", async () => {
  await login(owner, "aal2");
  await add("user4@example.com");
  await expect(add("user5@example.com")).rejects.toThrow(/limit/);
  expect(
    (await db.query<{ members: unknown[] }>("select team_members() as members")).rows[0]!.members,
  ).toHaveLength(5);
  await db.query("select remove_team_member($1)", [ids[2]]);
  await add("user5@example.com");
  await login(ids[2]!, "aal2");
  expect((await db.query<{ ok: boolean }>("select is_staff(auth.uid()) as ok")).rows[0]!.ok).toBe(
    false,
  );
  await db.exec("reset role");
  await expect(
    db.query("insert into user_roles(user_id,role) values($1,'admin')", [ids[6]]),
  ).rejects.toThrow(/limit/);
});
