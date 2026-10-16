import { describe, it, expect } from "vitest";
import { simulate, daysOfWork, type Loan } from "./debt";

const L = (id: string, balance: number, rate: number, payment: number): Loan => ({ id, name: id, balance, startBalance: balance, rate, payment });
const start = new Date(2026, 0, 1);

describe("debt engine", () => {
  it("pays a zero-interest loan in balance/payment months", () => {
    const r = simulate([L("a", 1000, 0, 100)], start);
    expect(r.monthsLeft).toBe(10);
    expect(r.totalInterest).toBe(0);
    expect(r.debtFreeDate).toEqual(new Date(2026, 10, 1));
  });

  it("adds monthly interest of balance x rate/100/12", () => {
    const r = simulate([L("a", 1200, 12, 2000)], start);
    expect(r.totalInterest).toBeCloseTo(12, 2);
    expect(r.monthsLeft).toBe(1);
  });

  it("rolls a paid-off loan's payment into the next loan", () => {
    const r = simulate([L("a", 100, 0, 100), L("b", 1000, 0, 100)], start);
    // b: 100 in month 1, then 200/month → 900 left needs 4.5 → 5 more months
    expect(r.monthsLeft).toBe(6);
  });

  it("sends extra money to the highest rate first", () => {
    const r = simulate([L("free", 0, 0, 100), L("low", 1000, 1, 10), L("high", 1000, 20, 10)], start);
    const b = r.schedule[0]!.balances;
    expect(b["high"]!).toBeLessThan(b["low"]!);
  });

  it("flags payments that don't cover interest and stops at 50 years", () => {
    const r = simulate([L("a", 10000, 24, 100)], start);
    expect(r.underwater[0]!.minPayment).toBe(201);
    expect(r.debtFreeDate).toBeNull();
    expect(r.schedule.length).toBe(600);
  });

  it("days of work = interest / (income / 22), rounded", () => {
    expect(daysOfWork(1000, 2200)).toBe(10);
    expect(daysOfWork(1050, 2200)).toBe(11);
  });

  it("extra money each month shortens the plan", () => {
    const r = simulate([L("a", 1000, 0, 100)], start, { extra: 100 });
    expect(r.monthsLeft).toBe(5);
  });

  it("snowball puts extra on the smallest loan first", () => {
    const loans = [L("big", 5000, 20, 50), L("small", 500, 5, 50)];
    const r = simulate(loans, start, { extra: 100, strategy: "snowball" });
    expect(r.schedule[0]!.balances["small"]!).toBeCloseTo(500 + 500 * 0.05 / 12 - 150, 2);
  });
});

import { daysCloser, quietLoans, skippedMonth, catchUpAmount } from "./debt";
describe("payments and quiet months", () => {
  const ls = [
    { id: "a", name: "A", balance: 1000, startBalance: 1000, rate: 12, payment: 100 },
    { id: "b", name: "B", balance: 2000, startBalance: 2000, rate: 6, payment: 400 },
  ];
  const now = new Date(2026, 5, 15);
  it("days closer scales with share of monthly payments", () => {
    expect(daysCloser(500, ls)).toBe(30);
    expect(daysCloser(0, ls)).toBe(0);
  });
  it("flags a loan with no payment for over a month", () => {
    const q = quietLoans(ls, [{ loanId: "a", date: "2026-06-10" }, { loanId: "b", date: "2026-04-20" }], "2026-01-01", now);
    expect(q.map((l) => l.id)).toEqual(["b"]);
  });
  it("does not flag again once handled", () => {
    expect(quietLoans(ls, [], "2026-04-01", now, { a: "2026-04-01", b: "2026-04-01" })).toEqual([]);
  });
  it("skipping a month moves the date later, catching up brings it back", () => {
    const { grown, oldDate, newDate } = skippedMonth(ls, "b", now);
    expect(newDate!.getTime()).toBeGreaterThan(oldDate!.getTime());
    const amt = catchUpAmount(grown, oldDate!, now, {}, 3)!;
    expect(amt).toBeGreaterThan(0);
    expect(simulate(grown, now, { boost: { amount: amt, months: 3 } }).debtFreeDate!.getTime()).toBeLessThanOrEqual(oldDate!.getTime());
  });
});
