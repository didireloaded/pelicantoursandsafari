// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
it("allows traveller planning with private per-user and shared quotas, denies anonymous access", async () => {
  const db = new PGlite();
  const user = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;insert into auth.users values('${user}');`,
    );
    await db.exec(
      readFileSync(
        new URL("../../supabase/migrations/202610120005_traveller_ai_planner.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec("set role anon");
    await expect(db.query("select consume_traveller_plan_request()")).rejects.toThrow();
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.exec("set role authenticated");
    for (let i = 0; i < 3; i++) await db.query("select consume_traveller_plan_request()");
    await expect(db.query("select consume_traveller_plan_request()")).rejects.toThrow(
      "Planning limit",
    );
    await expect(db.query("select * from private.traveller_plan_requests")).rejects.toThrow();
    await db.exec(
      `reset role;update private.traveller_plan_requests set created_at=now()-interval '2 hours';insert into private.traveller_plan_requests select '${user}',now()-interval '2 hours' from generate_series(1,97);set role authenticated;`,
    );
    await expect(db.query("select consume_traveller_plan_request()")).rejects.toThrow(
      "Planning limit",
    );
    await db.exec("reset role");
    const columns = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema='private' and table_name='traveller_plan_requests'",
    );
    expect(columns.rows.map((x) => x.column_name)).toEqual(["user_id", "created_at"]);
  } finally {
    await db.close();
  }
}, 30000);
