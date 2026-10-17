import { describe, expect, it } from "vitest";
import { correctTimeUnits, timeLabel } from "./time-label";

describe("calculated time units", () => {
  it("uses month for exactly one and months for other counts", () => {
    expect(timeLabel(1, "month")).toBe("1 month");
    expect(timeLabel(5, "month")).toBe("5 months");
    expect(timeLabel(0, "month")).toBe("0 months");
    expect(timeLabel("600+", "month")).toBe("600+ months");
  });
  it("handles days and years without treating fractions as one", () => {
    expect(timeLabel(1, "day")).toBe("1 day");
    expect(timeLabel(0.1, "day")).toBe("0.1 days");
    expect(timeLabel(1, "year")).toBe("1 year");
  });
  it("corrects units after verified numeric tokens have been replaced", () => {
    expect(correctTimeUnits("1 months; 5 month; 1 days; 0.1 day; 1 years")).toBe("1 month; 5 months; 1 day; 0.1 days; 1 year");
  });
});