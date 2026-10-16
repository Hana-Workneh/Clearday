import { describe, expect, it } from "vitest";
import { canContinueLoans, commitLoan, emptyLoan, loanErrors } from "./loan-entry";
const draft = {name: "Phone loan", balance: "1,200", rate: "12", payment: "100"};
describe("Friendly loan entry", () => {
  it("can continue with a complete loan without a separate add click", () => { expect(canContinueLoans(draft, [])).toBe(true); expect(commitLoan(draft, [], "phone")).toEqual([{id: "phone", name: "Phone loan", balance: 1200, startBalance: 1200, rate: 12, payment: 100}]); });
  it("greys continue only for an empty form and no saved loans", () => { expect(canContinueLoans(emptyLoan, [])).toBe(false); expect(canContinueLoans({...emptyLoan, name: "Phone loan"}, [])).toBe(true); expect(canContinueLoans(emptyLoan, commitLoan(draft, [], "phone") ?? [])).toBe(true); });
  it("explains missing payment without silently saving an incomplete loan", () => { const incomplete = {...draft, payment: ""}; expect(loanErrors(incomplete).payment).toBe("Add the monthly payment"); expect(commitLoan(incomplete, [], "phone")).toBeNull(); });
  it("updates an edited loan instead of adding a duplicate", () => { const loans = commitLoan(draft, [], "phone") ?? []; const edited = commitLoan({...draft, balance: "420"}, loans, "phone"); expect(edited).toHaveLength(1); expect(edited?.[0]?.balance).toBe(420); expect(edited?.[0]?.startBalance).toBe(1200); });
  it("accepts zero interest but rejects negative rates and nonpositive payments", () => { expect(loanErrors({...draft, rate: "0"})).toEqual({}); expect(loanErrors({...draft, rate: "-1"}).rate).toBeDefined(); expect(loanErrors({...draft, payment: "0"}).payment).toBeDefined(); });
});