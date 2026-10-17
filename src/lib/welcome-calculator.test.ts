import { expect, it } from "vitest";
import { QUICK_INTEREST_RATE } from "./welcome-calculator";
import { simulate } from "./debt";
it("uses 18% yearly average interest for the quick calculation", () => {
  expect(QUICK_INTEREST_RATE).toBe(18);
  const result = simulate([{ id: "quick", name: "Loan", balance: 4000, startBalance: 4000, rate: QUICK_INTEREST_RATE, payment: 155 }]);
  expect(result.schedule[0]?.interest).toBe(60);
});