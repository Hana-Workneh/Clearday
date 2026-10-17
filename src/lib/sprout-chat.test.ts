import { describe, expect, it } from "vitest";
import { chatFacts, checkedChatAnswer, SPROUT_USER_LIMIT, SPROUT_DEMO_LIMIT } from "./sprout-chat";
import type { Profile } from "./store";
const profile: Profile = {
  name: "Test",
  income: 1000,
  job: "teacher",
  currency: "USD",
  loans: [
    { id: "a", name: "Phone loan", balance: 1000, startBalance: 1000, rate: 0, payment: 100 },
  ],
  plan: { extra: 0 },
};
describe("Ask Sprout financial safeguards", () => {
  it("answers a custom total-debt question with the real balance", () => {
    const { facts, fallback } = chatFacts(profile, "How much do I owe in total?");
    expect(facts['balance']).toBe('$1,000');
    expect(checkedChatAnswer(fallback, facts, fallback)).toContain('$1,000 left');
  });
  it("uses actual income and payments for a custom budgeting question", () => {
    const { facts, fallback } = chatFacts(profile, "Help me budget for essentials");
    expect(facts['monthly']).toBe('$100');
    expect(facts['leftAfterDebt']).toBe('$900');
    expect(checkedChatAnswer(fallback, facts, fallback)).toContain('$900 before living costs');
  });
  it("explains a custom plan question without making up numbers", () => {
    const { facts, fallback } = chatFacts(profile, "Can you explain how my plan works?");
    expect(facts['monthly']).toBe('$100');
    expect(checkedChatAnswer(fallback, facts, fallback)).toContain('payments of $100');
  });
  it("converts a $10k annual gross raise to monthly take-home with an explicit illustrative tax assumption", () => {
    const r = chatFacts(
      profile,
      "If I get a $10k raise, how much sooner am I debt free?",
      new Date(2026, 9, 17),
    );
    expect(r.extraAmount).toBeCloseTo((10000 / 12) * 0.7);
    expect(r.extraPlan.monthsLeft).toBe(2);
    expect(r.facts["sooner"]).toBe("8");
    expect(r.facts["taxAssumption"]).toBe("30%");
  });
  it("does not tax an explicitly net monthly raise again", () => {
    const r = chatFacts(profile, "What if my take-home raise is $100 per month?");
    expect(r.extraAmount).toBe(100);
    expect(r.extraPlan.monthsLeft).toBe(5);
  });
  it("calculates recurring freelance take-home income using the engine", () => {
    const r = chatFacts(
      profile,
      "Freelance work leaves $100 net each month",
      new Date(2026, 9, 17),
    );
    expect(r.extraPlan.monthsLeft).toBe(5);
    expect(r.facts["sooner"]).toBe("5");
  });
  it("allows ten account questions per day", () => expect(SPROUT_USER_LIMIT).toBe(10));
  it("allows five demo questions per day", () => expect(SPROUT_DEMO_LIMIT).toBe(5));
  it("calculates fifty extra without AI estimates", () => {
    const result = chatFacts(profile, "What if I pay $50 more?", new Date(2026, 9, 17));
    expect(result.extraPlan.monthsLeft).toBe(7);
    expect(result.facts["sooner"]).toBe("3");
    expect(result.facts["extraDate"]).toBe("May 2027");
  });
  it("never guesses phone affordability without expenses", () => {
    const { facts, fallback } = chatFacts(profile, "Can I afford a $300 phone?");
    expect(facts["leftAfterDebt"]).toBe("$900");
    expect(checkedChatAnswer("Yes, you can afford 300", facts, fallback)).toContain(
      "can't say it's affordable",
    );
  });
  it("rejects invented amounts and dates", () => {
    const { facts, fallback } = chatFacts(profile, "What if I pay $50 more?");
    expect(checkedChatAnswer("You save $999 by June 2028", facts, fallback)).not.toContain("999");
  });
  it("fills only verified calculation tokens", () => {
    const { facts, fallback } = chatFacts(profile, "Which loan first?");
    expect(checkedChatAnswer("Start with {{priorityLoan}}.", facts, fallback)).toBe(
      "Start with Phone loan.",
    );
  });
  it("blocks unsafe suggestions", () => {
    const { facts, fallback } = chatFacts(profile, "help");
    expect(checkedChatAnswer("Try crypto trading", facts, fallback)).not.toContain("crypto");
  });
  it("includes payments rolled over from completed loans", () => {
    const result = chatFacts(
      {
        ...profile,
        loans: [
          ...profile.loans,
          { id: "paid", name: "Paid loan", balance: 0, startBalance: 200, rate: 0, payment: 50 },
        ],
      },
      "help",
    );
    expect(result.monthly).toBe(150);
  });
});
