// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111";
const traveller = "22222222-2222-4222-8222-222222222222";
let id: string;
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;insert into auth.users values('${staff}','staff@example.com'),('${traveller}','traveller@example.com');`,
  );
  for (const name of [
    "202610080001_enquiry_core.sql",
    "202610120002_traveller_workflows.sql",
    "20261012075627_approved_safari_packages.sql",
  ])
    await db.exec(
      readFileSync(new URL("../../supabase/migrations/" + name, import.meta.url), "utf8"),
    );
  await db.exec(`insert into user_roles(user_id,role) values('${staff}','staff');`);
}, 30000);
afterAll(() => db.close());
async function login(user: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
}
describe.sequential("Structured package database boundary", () => {
  it("permits staff draft writes while hiding the package from travellers", async () => {
    await login(staff);
    const result = await db.query<{ id: string }>(
      "insert into travel_details(category,title,body,source_url,updated_by,safari_slug,package_details) values('itinerary','Verified package','Verified summary','https://example.com',$1,'big-five-etosha','{}') returning id",
      [staff],
    );
    id = result.rows[0]!.id;
    await login(traveller);
    expect((await db.query("select * from travel_details")).rows).toHaveLength(0);
    await expect(
      db.query(
        "insert into travel_details(category,title,body,source_url,updated_by,safari_slug,package_details) values('itinerary','Unauthorized','Unauthorized','https://example.com',$1,'big-five-etosha','{}')",
        [traveller],
      ),
    ).rejects.toThrow();
  });
  it("publishes only through staff and prevents ambiguous approved packages", async () => {
    await login(staff);
    await db.query("update travel_details set approved=true where id=$1", [id]);
    await expect(
      db.query(
        "insert into travel_details(category,title,body,source_url,updated_by,safari_slug,package_details,approved) values('itinerary','Duplicate','Duplicate','https://example.com',$1,'big-five-etosha','{}',true)",
        [staff],
      ),
    ).rejects.toThrow();
    await login(traveller);
    expect((await db.query("select safari_slug from travel_details")).rows).toEqual([
      { safari_slug: "big-five-etosha" },
    ]);
    expect(
      (
        await db.query(
          "update travel_details set safari_slug='cross-border' where id=$1 returning id",
          [id],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("retains timestamp conflict protection for staff edits", async () => {
    await login(staff);
    const before = await db.query<{ updated_at: Date }>(
      "select updated_at from travel_details where id=$1",
      [id],
    );
    await db.query("update travel_details set body='Changed' where id=$1", [id]);
    expect(
      (
        await db.query(
          "update travel_details set body='Stale overwrite' where id=$1 and updated_at=$2 returning id",
          [id, before.rows[0]!.updated_at],
        )
      ).rows,
    ).toHaveLength(0);
  });
});
