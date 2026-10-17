import { describe, expect, it } from "vitest";
import { rememberTour, shouldShowTour, tourKey } from "./product-tour";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("tour dismissal", () => {
  it("starts on the first visit", () => {
    expect(shouldShowTour(storage(), tourKey(true, null))).toBe(true);
  });
  it("never automatically repeats a finished tour", () => {
    const saved = storage();
    const key = tourKey(false, "A");
    rememberTour(saved, key, "finished");
    expect(shouldShowTour(saved, key)).toBe(false);
  });
  it("never automatically repeats a skipped tour", () => {
    const saved = storage();
    const key = tourKey(true, null);
    rememberTour(saved, key, "skipped");
    expect(shouldShowTour(saved, key)).toBe(false);
  });
  it("keeps demo and each account independent", () => {
    const saved = storage();
    rememberTour(saved, tourKey(false, "A"), "finished");
    expect(shouldShowTour(saved, tourKey(false, "B"))).toBe(true);
    expect(shouldShowTour(saved, tourKey(true, "A"))).toBe(true);
  });
});
