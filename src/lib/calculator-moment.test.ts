import { describe, expect, it } from "vitest";
import { BOUNCE_COUNT, BOUNCE_MS, HOVER_MARGIN, VIEW_THRESHOLD, canReplay, pointerTilt } from "./calculator-moment";
describe("Calculator character moment", () => {
  it("plays exactly two 500ms bounces", () => { expect(BOUNCE_COUNT).toBe(2); expect(BOUNCE_MS).toBe(500); });
  it("waits at least three seconds between replays", () => { expect(canReplay(2999, 0)).toBe(false); expect(canReplay(3000, 0)).toBe(true); });
  it("limits pointer tilt to four degrees", () => { expect(pointerTilt(2)).toBe(4); expect(pointerTilt(-2)).toBe(-4); });
  it("uses a forty pixel hover margin", () => { expect(HOVER_MARGIN).toBe(40); });
  it("rearms at half visibility", () => { expect(VIEW_THRESHOLD).toBe(0.5); });
});