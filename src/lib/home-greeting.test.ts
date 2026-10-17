import { describe, expect, it } from "vitest";
import { homeGreeting } from "./home-greeting";
import type { Profile } from "./store";

const loan = { id: "one", name: "Loan", balance: 900, startBalance: 1000, rate: 10, payment: 50 };
const profile: Profile = { name: "Hana", income: 500, job: "Marketing officer", loans: [loan] };
describe("Home greeting rules", () => {
  it("hides percent below one percent even when rounded to one", () => {
    expect(homeGreeting({ ...profile, loans: [{ ...loan, balance: 992 }] }).showPercent).toBe(false);
  });
  it("shows the real percent from one percent onward", () => {
    const result = homeGreeting({ ...profile, loans: [{ ...loan, balance: 990 }] });
    expect(result.showPercent).toBe(true);
    expect(result.percent).toBe(1);
    expect(homeGreeting(profile).percent).toBe(10);
  });
  it("cheers when the latest payment crossed a milestone", () => {
    expect(homeGreeting({ ...profile, payments: [{ id: "p", loanId: "one", amount: 50, date: "2026-10-17" }] }).cheering).toBe(true);
    expect(homeGreeting({ ...profile, loans: [{ ...loan, balance: 800 }], payments: [{ id: "p", loanId: "one", amount: 50, date: "2026-10-17" }] }).cheering).toBe(false);
  });
});