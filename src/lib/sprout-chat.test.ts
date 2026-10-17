import { describe, expect, it } from "vitest";
import { chatFacts, checkedChatAnswer, SPROUT_USER_LIMIT, SPROUT_DEMO_LIMIT } from "./sprout-chat";
import type { Profile } from "./store";
const profile: Profile = {name:"Test", income:1000, job:"teacher", currency:"USD", loans:[{id:"a",name:"Phone loan",balance:1000,startBalance:1000,rate:0,payment:100}],plan:{extra:0}};
describe("Ask Sprout financial safeguards", () => {
  it("allows ten account questions per day", () => expect(SPROUT_USER_LIMIT).toBe(10));
  it("allows five demo questions per day", () => expect(SPROUT_DEMO_LIMIT).toBe(5));
  it("calculates fifty extra without AI estimates", () => {const result = chatFacts(profile,"What if I pay $50 more?",new Date(2026,9,17)); expect(result.extraPlan.monthsLeft).toBe(7); expect(result.facts.sooner).toBe("3"); expect(result.facts.extraDate).toBe("May 2027");});
  it("never guesses phone affordability without expenses", () => {const {facts,fallback} = chatFacts(profile,"Can I afford a $300 phone?"); expect(facts.leftAfterDebt).toBe("$900"); expect(checkedChatAnswer("Yes, you can afford 300",facts,fallback)).toContain("can't say it's affordable");});
  it("rejects invented amounts and dates", () => {const {facts,fallback} = chatFacts(profile,"What if I pay $50 more?"); expect(checkedChatAnswer("You save $999 by June 2028",facts,fallback)).not.toContain("999");});
  it("fills only verified calculation tokens", () => {const {facts,fallback} = chatFacts(profile,"Which loan first?"); expect(checkedChatAnswer("Start with {{priorityLoan}}.",facts,fallback)).toBe("Start with Phone loan.");});
  it("blocks unsafe suggestions", () => {const {facts,fallback} = chatFacts(profile,"help"); expect(checkedChatAnswer("Try crypto trading",facts,fallback)).not.toContain("crypto");});
});