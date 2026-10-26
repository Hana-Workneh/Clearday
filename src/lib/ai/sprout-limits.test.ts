// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Execute the deployed claim SQL only in memory: no credentials or real counters.
// The claim SQL is kept as a fixture so tests never consume the real demo allowance;
// point this back at the migration file if it is recreated.
const migration = readFileSync(
  new URL("./claim-sprout-question.fixture.sql", import.meta.url),
  "utf8",
);
let db: PGlite;
beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE public.sprout_usage (
      visitor text NOT NULL, day date NOT NULL, count integer NOT NULL DEFAULT 0,
      PRIMARY KEY (visitor, day)
    );
    CREATE TABLE public.test_clock (value timestamptz);
    INSERT INTO public.test_clock VALUES ('2026-10-17 23:59:59+00');
    CREATE FUNCTION public.test_now() RETURNS timestamptz LANGUAGE sql AS
      'SELECT value FROM public.test_clock';
  `);
  // Replace the clock only; all caps, locks and increments are the actual SQL.
  await db.exec(migration.replace("now()", "public.test_now()"));
});
afterEach(async () => { await db.close(); });
async function claim(visitor: string, demo = true) {
  const result = await db.query<{ allowed: boolean }>(
    "SELECT public.claim_sprout_question($1, $2) AS allowed", [visitor, demo],
  );
  return result.rows[0]?.allowed;
}
async function total() {
  const result = await db.query<{ count: number }>(
    "SELECT count FROM public.sprout_demo_daily_usage WHERE day = '2026-10-17'",
  );
  return result.rows[0]?.count;
}
describe("isolated atomic demo allowances", () => {
  it("allows exactly 15 questions for a visitor, without charging denied requests", async () => {
    for (let i = 0; i < 15; i++) expect(await claim("demo:a")).toBe(true);
    expect(await claim("demo:a")).toBe(false);
    expect(await total()).toBe(15);
    expect(await claim("demo:b")).toBe(true);
  });
  it("allows exactly 500 total across visitors and does not charge denied visitors", async () => {
    const allowed = await db.query<{ allowed: number }>(`
      SELECT count(*) FILTER (WHERE public.claim_sprout_question('demo:' || i, true))::int AS allowed
      FROM generate_series(1, 500) AS i
    `);
    expect(allowed.rows[0]?.allowed).toBe(500);
    expect(await claim("demo:new")).toBe(false);
    expect(await total()).toBe(500);
    const visitor = await db.query("SELECT * FROM public.sprout_usage WHERE visitor = 'demo:new'");
    expect(visitor.rows).toHaveLength(0);
  });
  it("keeps accounts at 10 and separate from an exhausted demo budget", async () => {
    await db.exec("INSERT INTO public.sprout_demo_daily_usage VALUES ('2026-10-17', 500)");
    for (let i = 0; i < 10; i++) expect(await claim("account:a", false)).toBe(true);
    expect(await claim("account:a", false)).toBe(false);
    expect(await total()).toBe(500);
  });
  it("renews both demo budgets exactly at midnight UTC regardless of session timezone", async () => {
    await db.exec(`
      SET TIME ZONE 'Africa/Johannesburg';
      INSERT INTO public.sprout_demo_daily_usage VALUES ('2026-10-17', 500);
      INSERT INTO public.sprout_usage VALUES ('demo:a', '2026-10-17', 15);
    `);
    expect(await claim("demo:a")).toBe(false);
    await db.exec("UPDATE public.test_clock SET value = '2026-10-18 00:00:00+00'");
    expect(await claim("demo:a")).toBe(true);
    const day = await db.query<{ count: number }>("SELECT count FROM public.sprout_demo_daily_usage WHERE day = '2026-10-18'");
    expect(day.rows[0]?.count).toBe(1);
    expect(await total()).toBe(500);
  });
  it("does not overshoot the final global slot on simultaneous claims", async () => {
    await db.exec("INSERT INTO public.sprout_demo_daily_usage VALUES ('2026-10-17', 499)");
    const results = await Promise.all([claim("demo:a"), claim("demo:b"), claim("demo:c")]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await total()).toBe(500);
  });
});