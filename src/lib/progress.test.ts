import { describe, expect, it } from "vitest";
import { debtProgress, principalHistory } from "./progress";
import { createDemoPersona, demoPersonas, refreshDemoBaseline } from "./demo-personas";
import { simulate, formatMonth } from "./debt";
import { homeGreeting } from "./home-greeting";
import { chatFacts } from "./sprout-chat";

const now = new Date(2026, 9, 18);
describe("One principal-based progress calculation", () => {
  it("uses Hana's original $3,850 debt, not her $660 gross payments", () => {
    const hana = createDemoPersona("hana", now);
    expect(debtProgress(hana.loans)).toMatchObject({ total: 3850, left: 3438.84, paid: 411.16, percent: 11 });
    expect(hana.payments?.reduce((s, p) => s + p.amount, 0)).toBe(660);
    expect(principalHistory(hana.loans, hana.payments ?? []).at(-1)?.cumulative).toBe(411.16);
  });
  it.each(demoPersonas)("keeps $name totals, greeting and chat consistent", ({ id }) => {
    const p = createDemoPersona(id, now);
    const stats = debtProgress(p.loans);
    expect(homeGreeting(p, now).percent).toBe(stats.percent);
    expect(stats.paid + stats.left).toBeCloseTo(stats.total, 2);
    expect(principalHistory(p.loans, p.payments ?? []).at(-1)?.cumulative).toBe(stats.paid);
    expect(chatFacts(p, "total debt", now).facts["balance"]).toBe(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(stats.left));
  });
  it("uses the same rule for an account with interest and incomplete payment history", () => {
    const account = { ...createDemoPersona("hana", now), demo: false, loans: [{ id: "a", name: "Loan", startBalance: 1000, balance: 750, rate: 18, payment: 50 }], payments: [{ id: "p", loanId: "a", amount: 300, date: "2026-10-08" }] };
    expect(debtProgress(account.loans)).toMatchObject({ total: 1000, left: 750, paid: 250, percent: 25 });
    expect(homeGreeting(account, now).percent).toBe(25);
  });
  it("does not invent debt or negative progress for empty or growing loans", () => {
    expect(debtProgress([])).toMatchObject({ total: 0, paid: 0, left: 0, percent: 0 });
    expect(debtProgress([{ startBalance: 100, balance: 110 }])).toMatchObject({ paid: 0, percent: 0, left: 110 });
  });
  it("sets Hana's first January 2029 plan one month after December 2028", () => {
    const p = createDemoPersona("hana", now);
    expect(formatMonth(new Date(p.startDebtFree ?? ""))).toBe("January 2029");
    const date = simulate(p.loans, now, p.plan).debtFreeDate;
    expect(date && formatMonth(date)).toBe("December 2028");
  });
  it.each(demoPersonas)("sets $name original plan one calendar month later", ({ id }) => {
    const p = createDemoPersona(id, now);
    const current = simulate(p.loans, now).debtFreeDate;
    const original = new Date(p.startDebtFree ?? "");
    expect(current && (original.getFullYear() - current.getFullYear()) * 12 + original.getMonth() - current.getMonth()).toBe(1);
  });
  it("updates stale demo baselines without changing account baselines or loan data", () => {
    const p = { ...createDemoPersona("hana", now), startDebtFree: "2028-12-01T00:00:00.000Z" };
    expect(refreshDemoBaseline(p, now).startDebtFree).toBe("2029-01-01T00:00:00.000Z");
    expect(refreshDemoBaseline(p, now).loans).toBe(p.loans);
    expect(refreshDemoBaseline({ ...p, demo: false }, now).startDebtFree).toBe(p.startDebtFree);
  });
});