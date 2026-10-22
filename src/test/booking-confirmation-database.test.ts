// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
import { bookingStage, bookingToEnquiry } from "@/lib/booking";
import { reservationEvents } from "@/lib/reservation-calendar";
import type { Lead } from "@/lib/admin-workspace";
const db = new PGlite();
const staff = "11111111-1111-4111-8111-111111111111";
const outsider = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;insert into auth.users values('${staff}'),('${outsider}');`,
  );
  for (const file of [
    "supabase/migrations/202610080001_enquiry_core.sql",
    "drizzle/migrations/0005_booking_codes.sql",
  ])
    await db.exec(readFileSync(file, "utf8"));
  await db.exec(
    `create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;`,
  );
  await db.exec(
    readFileSync("drizzle/migrations/0003_client_admin_content.sql", "utf8").split(
      "-- Client-managed content.",
    )[0]!,
  );
  await db.exec(readFileSync("drizzle/migrations/0010_confirmed_booking_calendar.sql", "utf8"));
  await db.exec(`insert into user_roles(user_id,role) values('${staff}','staff');`);
}, 30000);
afterAll(() => db.close());
it("receives once, assigns one private reference, confirms with staff revision, and exposes only contact-matched status", async () => {
  const request = bookingToEnquiry({
    request_id: crypto.randomUUID(),
    trip_code: "ENP1",
    name: "Synthetic booking test",
    email: "test@example.com",
    phone: null,
    contact_preference: "Email",
    dates: "June 2027",
    travellers: 2,
    notes: "Isolated test only",
  });
  await db.exec("set role service_role");
  const submit = () =>
    db.query<{ id: string }>("select submit_enquiry($1,$2) as id", [
      JSON.stringify(request),
      "a".repeat(64),
    ]);
  const id = (await submit()).rows[0]!.id;
  expect((await submit()).rows[0]!.id).toBe(id);
  const assign = () =>
    db.query<{ ref: string }>("select assign_booking_ref($1,'ENP1') as ref", [id]);
  const ref = (await assign()).rows[0]!.ref;
  expect((await assign()).rows[0]!.ref).toBe(ref);
  const lookup = (contact = "test@example.com") =>
    db.query<{ status: string }>("select * from lookup_booking($1,$2,$3)", [
      ref,
      contact,
      "b".repeat(64),
    ]);
  expect(bookingStage((await lookup()).rows[0]!.status)).toBe("Received");
  expect((await lookup("wrong@example.com")).rows).toHaveLength(0);
  await db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='${outsider}';`);
  expect(
    (await db.query("update enquiries set status='confirmed' where id=$1 returning id", [id])).rows,
  ).toHaveLength(0);
  await expect(
    db.query("select * from lookup_booking($1,$2,$3)", [ref, "test@example.com", "b".repeat(64)]),
  ).rejects.toThrow();
  await expect(
    db.query("select confirm_booking($1,now(),'2027-06-22','2027-06-24')", [id]),
  ).rejects.toThrow(/Staff verification/);
  await db.exec(`set request.jwt.claim.sub='${staff}';set request.jwt.claim.aal='aal1';`);
  await expect(
    db.query("select confirm_booking($1,now(),'2027-06-22','2027-06-24')", [id]),
  ).rejects.toThrow(/Staff verification/);
  await db.exec(`set request.jwt.claim.sub='${staff}';set request.jwt.claim.aal='aal2';`);
  const revision = (
    await db.query<{ version: string }>(
      "select updated_at::text as version from enquiries where id=$1",
      [id],
    )
  ).rows[0]!.version;
  await expect(
    db.query("update enquiries set status='confirmed' where id=$1", [id]),
  ).rejects.toThrow(/travel dates/);
  await expect(
    db.query("select confirm_booking($1,$2,'2027-06-24','2027-06-22')", [id, revision]),
  ).rejects.toThrow(/valid travel dates/);
  await db.query("select confirm_booking($1,$2,'2027-06-22','2027-06-24')", [id, revision]);
  const scheduled = (
    await db.query<{ status: string; start: string }>(
      "select status,confirmed_starts_on::text as start from enquiries where id=$1",
      [id],
    )
  ).rows[0]!;
  expect(scheduled).toEqual({ status: "confirmed", start: "2027-06-22" });
  await expect(
    db.query("select confirm_booking($1,$2,'2027-06-22','2027-06-24')", [id, revision]),
  ).rejects.toThrow(/changed/);
  expect(
    (
      await db.query(
        "update enquiries set status='closed' where id=$1 and updated_at=$2::timestamptz returning id",
        [id, revision],
      )
    ).rows,
  ).toHaveLength(0);
  // Re-read the persisted row as the calendar loader does, then reschedule it.
  const calendarRows = async () =>
    (
      await db.query<Lead>(
        `select id,name,status,created_at::text,
      null::text as follow_up_on,residence,booking_ref,
      confirmed_starts_on::text,confirmed_ends_on::text from enquiries where id=$1`,
        [id],
      )
    ).rows;
  expect(reservationEvents([], [], await calendarRows())).toEqual([
    expect.objectContaining({ id, kind: "request", startsOn: "2027-06-22", endsOn: "2027-06-24" }),
  ]);
  const currentRevision = (
    await db.query<{ version: string }>(
      "select updated_at::text as version from enquiries where id=$1",
      [id],
    )
  ).rows[0]!.version;
  await db.query("select confirm_booking($1,$2,'2027-07-03','2027-07-05')", [id, currentRevision]);
  const moved = reservationEvents([], [], await calendarRows());
  expect(moved).toHaveLength(1);
  expect(moved[0]).toMatchObject({ id, startsOn: "2027-07-03", endsOn: "2027-07-05" });
  expect((await db.query("select id from enquiries")).rows).toHaveLength(1);
  await db.exec("reset role;set role service_role");
  expect(bookingStage((await lookup("TEST@example.com")).rows[0]!.status)).toBe("Confirmed");
  expect(
    (
      await db.query("select * from lookup_booking($1,$2,$3)", [
        "ENP1-XXXX",
        "test@example.com",
        "c".repeat(64),
      ])
    ).rows,
  ).toHaveLength(0);
  await db.exec("reset role;set role anon");
  await expect(db.query("select * from enquiries")).rejects.toThrow();
  await expect(db.query("select assign_booking_ref($1,'ENP1')", [id])).rejects.toThrow();
});
