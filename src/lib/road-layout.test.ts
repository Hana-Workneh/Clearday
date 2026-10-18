import { describe, expect, it } from "vitest";
import { verticalRoadLayout } from "./road-layout";

describe("vertical road spacing", () => {
  const stops = [{ id: "first", pct: 3 }, { id: "p10", pct: 10 }, { id: "p25", pct: 25 }, { id: "p50", pct: 50 }, { id: "p75", pct: 75 }];
  it("keeps close stops in separate rows and progress before the next stop", () => {
    const { positions } = verticalRoadLayout(stops, 11, false);
    expect((positions["p10"] ?? 0) - (positions["first"] ?? 0)).toBeGreaterThanOrEqual(48);
    expect(positions["sprout"]).toBeGreaterThan(positions["p10"] ?? 0);
    expect(positions["stone"]).toBeGreaterThan(positions["sprout"] ?? 0);
    expect(positions["p25"]).toBeGreaterThan(positions["stone"] ?? 0);
    expect(positions["flag"]).toBeGreaterThan(positions["p75"] ?? 0);
  });
  it("omits Stone for a completed road", () => {
    expect(verticalRoadLayout(stops, 100, true).positions["stone"]).toBeUndefined();
  });
});