import { describe, expect, it } from "vitest";
import { claimHeroHint, HERO_HINT_DELAY, hintPayment } from "./hero-slider-hint";

describe("hero visual hint", () => {
  it("waits one second", () => expect(HERO_HINT_DELAY).toBe(1000));
  it("only claims once per session", () => {
    const rows = new Map<string, string>();
    const storage = { getItem: (key: string) => rows.get(key) ?? null, setItem: (key: string, value: string) => { rows.set(key, value); } };
    expect(claimHeroHint(storage)).toBe(true);
    expect(claimHeroHint(storage)).toBe(false);
  });
  it("nudges right then returns to the original payment", () => {
    expect(hintPayment(155, 0)).toBe(155);
    expect(hintPayment(155, .5)).toBe(195);
    expect(hintPayment(155, 1)).toBe(155);
  });
});