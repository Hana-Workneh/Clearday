import { expect, it } from "vitest";
import { exactExtra } from "./extra-input";
it("keeps exact cents instead of snapping typed extra to slider increments", () => {
  expect(exactExtra("12.75", 300)).toBe(12.75);
  expect(exactExtra(".75", 300)).toBe(.75);
});
it("keeps empty editing separate from the saved amount", () => {
  expect(exactExtra("", 300)).toBeNull();
  expect(exactExtra("invalid", 300)).toBeNull();
});
it("respects the existing slider range", () => {
  expect(exactExtra("-1", 300)).toBe(0);
  expect(exactExtra("400", 300)).toBe(300);
});