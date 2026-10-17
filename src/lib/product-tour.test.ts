import { describe, expect, it } from "vitest";
import {
  consumeTourReplay,
  hasTourReplay,
  rememberTour,
  requestProductTour,
  shouldShowTour,
  tourKey,
  tourStorage,
} from "./product-tour";
import { vi } from "vitest";

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
  it("starts again in every new demo session even with old local dismissal", () => {
    const localStorage = storage();
    const sessionStorage = storage();
    const key = tourKey(true, null);
    rememberTour(localStorage, key, "skipped");
    const firstSession = tourStorage(true, { localStorage, sessionStorage });
    expect(shouldShowTour(firstSession, key)).toBe(true);
    rememberTour(firstSession, key, "finished");
    expect(shouldShowTour(firstSession, key)).toBe(false);
    expect(
      shouldShowTour(tourStorage(true, { localStorage, sessionStorage: storage() }), key),
    ).toBe(true);
  });
  it("remembers a new account's completed tour across sessions", () => {
    const localStorage = storage();
    const key = tourKey(false, "new-account");
    expect(
      shouldShowTour(tourStorage(false, { localStorage, sessionStorage: storage() }), key),
    ).toBe(true);
    rememberTour(localStorage, key, "finished");
    expect(
      shouldShowTour(tourStorage(false, { localStorage, sessionStorage: storage() }), key),
    ).toBe(false);
  });
  it("keeps replay pending across navigation until the spotlight starts", () => {
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    try {
      requestProductTour();
      expect(hasTourReplay()).toBe(true);
      expect(hasTourReplay()).toBe(true);
      consumeTourReplay();
      expect(hasTourReplay()).toBe(false);
      requestProductTour();
      expect(hasTourReplay()).toBe(true);
    } finally {
      consumeTourReplay();
      vi.unstubAllGlobals();
    }
  });
});
