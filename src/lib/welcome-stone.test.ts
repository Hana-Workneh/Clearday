import { describe, expect, it } from "vitest";
import { stoneSize, stoneReaction, stoneIsPebbles } from "./welcome-stone";
describe("Welcome Stone presentation rules", () => {
  it("scales from 70px at $500 to 170px at $20,000", () => {
    expect(stoneSize(500)).toBe(70);
    expect(stoneSize(20000)).toBe(170);
  });
  it("crumbles at twelve months and returns above twelve", () => {
    expect(stoneIsPebbles(12)).toBe(true);
    expect(stoneIsPebbles(13)).toBe(false);
  });
  it("celebrates a higher payment only when the date gets closer", () => {
    expect(stoneReaction({ pay: 155, months: 32 }, { pay: 200, months: 24 })).toBe("closer");
    expect(stoneReaction({ pay: 155, months: 32 }, { pay: 160, months: 32 })).toBe("calm");
  });
  it("reacts smugly when the payment goes down", () => {
    expect(stoneReaction({ pay: 200, months: 24 }, { pay: 155, months: 32 })).toBe("further");
  });
});
