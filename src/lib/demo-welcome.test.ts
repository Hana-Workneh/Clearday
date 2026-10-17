import { expect, it } from "vitest";
import { claimDemoWelcome, DEMO_WELCOME_DURATION } from "./demo-welcome";
it("shows the welcome once per browser session for six seconds", () => {
  const rows = new Map<string, string>();
  const storage = { getItem: (key: string) => rows.get(key) ?? null, setItem: (key: string, value: string) => { rows.set(key, value); } };
  expect(claimDemoWelcome(storage)).toBe(true);
  expect(claimDemoWelcome(storage)).toBe(false);
  rows.clear();
  expect(claimDemoWelcome(storage)).toBe(true);
  expect(DEMO_WELCOME_DURATION).toBe(6000);
});