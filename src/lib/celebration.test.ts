import { describe, expect, it } from "vitest";
import { celebrationStats, completedDemo, isDebtFree, nextWin } from "./celebration";
import type { Profile } from "./store";
const profile: Profile = { name: "Hana", income: 500, job: "Marketing officer", startDebtFree: "2027-06-01", loans: [{ id: "phone", name: "Phone loan", balance: 420, startBalance: 600, rate: 9, payment: 40 }], payments: [{ id: "one", loanId: "phone", amount: 180, date: "2026-09-16" }] };
describe("Debt-free moment", () => {
  it("shows $120 remaining to halfway on a $1,000 loan with $620 left", () => {
    expect(nextWin({loans: [{...profile.loans[0], id: "test", name: "Loan", rate: 0, payment: 100, startBalance: 1000, balance: 620}], payments: []})).toEqual({name: "Halfway there", reached: false, remaining: 120});
  });
  it("celebrates halfway when the latest $120 payment reaches it", () => {
    expect(nextWin({loans: [{id: "test", name: "Loan", rate: 0, payment: 100, startBalance: 1000, balance: 500}], payments: [{id: "latest", loanId: "test", amount: 120, date: "2026-10-16"}]})).toEqual({name: "Halfway there", reached: true, remaining: 0});
  });
  it("shows the next win after a later payment, without claiming another crossing", () => {
    expect(nextWin({loans: [{id: "test", name: "Loan", rate: 0, payment: 100, startBalance: 1000, balance: 480}], payments: [{id: "latest", loanId: "test", amount: 20, date: "2026-10-17"}]})).toEqual({name: "Debt free", reached: false, remaining: 480});
    expect(nextWin({loans: [], payments: []})).toBeNull();
  });
  it("celebrates only when every existing loan is paid off", () => { expect(isDebtFree(profile)).toBe(false); expect(isDebtFree({loans: []})).toBe(false); expect(isDebtFree({...profile, loans: profile.loans.map(l => ({...l, balance: 0}))})).toBe(true); });
  it("calculates logged totals, loans paid and calendar months earlier", () => { const preview = completedDemo(profile, new Date("2026-10-16T12:00:00Z")); const stats = celebrationStats(preview); expect(stats.totalPaid).toBe(600); expect(stats.loansPaid).toBe(1); expect(stats.monthsEarlier).toBe(8); });
  it("preview does not change saved loans or history", () => { const preview = completedDemo(profile); expect(preview.loans[0]?.balance).toBe(0); expect(profile.loans[0]?.balance).toBe(420); expect(profile.payments).toHaveLength(1); });
  it("does not claim earlier completion without an original plan", () => { expect(celebrationStats({...profile, startDebtFree: null}).monthsEarlier).toBeNull(); });
});