import { describe, expect, it } from "vitest";
import { simulate, type Loan } from "./debt";
import { createDemoPersona } from "./demo-personas";
import { canCompareOrder, comparePayoff, equivalentOrders } from "./pay-faster";

const start = new Date(2026, 9, 1);
const loan = (balance: number, payment: number): Loan => ({ id: "a", name: "Loan", balance, startBalance: balance, rate: 0, payment });
const compare = (loans: Loan[], extra: number) => comparePayoff(simulate(loans, start), simulate(loans, start, { extra }), loans, {}, { extra });

describe("Pay faster comparisons", () => {
  it("shows two estimated weeks even when the payoff month stays the same", () => {
    const loans = [loan(90, 100)];
    expect(simulate(loans, start).monthsLeft).toBe(1);
    expect(simulate(loans, start, { extra: 100 }).monthsLeft).toBe(1);
    const result = compare(loans, 100);
    expect(result.days).toBe(14);
    expect(result.time).toBe("About 2 weeks sooner");
    expect(result.nextWidth).toBeCloseTo(50);
  });
  it("shows estimated days for benefits under a week", () => {
    const result = compare([loan(90, 100)], 10);
    expect(result.days).toBe(2);
    expect(result.time).toBe("About 2 days sooner");
    expect(result.nextWidth).toBeCloseTo(90.909);
  });
  it("does not invent savings with zero extra", () => {
    const result = compare([loan(900, 100)], 0);
    expect(result.days).toBe(0);
    expect(result.saving).toBe(0);
    expect(result.nextWidth).toBe(100);
  });
  it("Hana's $75 extra saves nine scheduled months and $292.76 interest", () => {
    const loans = createDemoPersona("hana", start).loans;
    const base = simulate(loans, start);
    const next = simulate(loans, start, { extra: 75 });
    expect((base.monthsLeft ?? 0) - (next.monthsLeft ?? 0)).toBe(9);
    const result = compare(loans, 75);
    expect(result.saving).toBe(292.76);
    expect(result.nextWidth).toBeLessThan(70);
  });
  it("Hana's $50 extra saves months and meaningful interest", () => {
    const hana = createDemoPersona("hana", start);
    expect(hana.loans.map(l => [l.name, l.startBalance, l.rate])).toEqual([
      ["Phone loan", 650, 24], ["Personal loan", 2800, 18], ["Salary advance", 400, 30],
    ]);
    const result = compare(hana.loans, 50);
    expect(result.difference).toBeGreaterThanOrEqual(6);
    expect(result.saving).toBeGreaterThan(200);
  });
  it("requires at least two active loans to compare order", () => {
    expect(canCompareOrder([loan(90, 100)])).toBe(false);
    expect(canCompareOrder([loan(90, 100), { ...loan(0, 100), id: "b" }])).toBe(false);
    expect(canCompareOrder([loan(90, 100), { ...loan(90, 100), id: "b" }])).toBe(true);
  });
  it("identifies identical order results without hiding meaningful differences", () => {
    const loans = [loan(900, 100), { ...loan(500, 50), id: "b" }];
    const results = (["avalanche", "snowball", "order"] as const).map(strategy => simulate(loans, start, { extra: 75, strategy }));
    expect(equivalentOrders(results)).toBe(true);
    expect(equivalentOrders([results[0], simulate(loans, start, { extra: 200 })].filter(result => result !== undefined))).toBe(false);
  });
});