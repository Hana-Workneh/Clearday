import { describe, it, expect } from "vitest";
import { removeLoan, markPaidOff } from "./loan-actions";
const loans = [{ id: "a", name: "Phone loan", balance: 300, startBalance: 500, rate: 10, payment: 50 }, { id: "b", name: "B", balance: 100, startBalance: 100, rate: 5, payment: 20 }];
const payments = [{ id: "p1", loanId: "a", amount: 200, date: "2026-01-01" }, { id: "p2", loanId: "b", amount: 10, date: "2026-01-01" }];
describe("loan actions", () => {
  it("deleting a loan removes its payments too", () => {
    const r = removeLoan({ loans, payments }, "a");
    expect(r.loans.map((l) => l.id)).toEqual(["b"]);
    expect(r.payments!.map((p) => p.id)).toEqual(["p2"]);
  });
  it("mark as paid off sets balance to 0 and logs the rest as a payment", () => {
    const r = markPaidOff({ loans, payments }, "a", "2026-10-16", "x");
    expect(r.loans[0]?.balance).toBe(0);
    expect(r.payments!.at(-1)).toEqual({ id: "x", loanId: "a", amount: 300, date: "2026-10-16" });
  });
});
