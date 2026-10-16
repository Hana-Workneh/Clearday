import { describe, it, expect } from "vitest";
import { buildTimeline, safeIdeas, ideaImpact, extraFromIdea , safeAdvice } from "./plan";
import type { Profile } from "./store";
const now = new Date(2026, 9, 16);
const profile: Profile = { name: "A", job: "Barista", income: 3000, startedAt: "2026-09-01", loans: [{ id: "a", name: "A", balance: 100, startBalance: 100, rate: 0, payment: 50 }, { id: "b", name: "B", balance: 300, startBalance: 300, rate: 0, payment: 50 }], payments: [{ id: "p", loanId: "a", amount: 50, date: "2026-09-05" }] };
describe("My plan", () => {
  it("has monthly entries, logged first payment and a current marker", () => {
    const rows = buildTimeline(profile, now, {});
    expect(rows.map(r => r.date.getMonth())).toEqual([8,9,10,11,0,1]);
    expect(rows[0]?.milestones).toEqual(["First payment"]);
    expect(rows.filter(r => r.current).map(r => r.date.getMonth())).toEqual([9]);
  });
  it("marks first payoff, halfway and debt free using the loan schedule", () => {
    const rows = buildTimeline(profile, now, {});
    expect(rows.find(r => r.milestones.includes("First loan paid off"))?.date.getMonth()).toBe(11);
    expect(rows.find(r => r.milestones.includes("Halfway"))?.date.getMonth()).toBe(11);
    expect(rows.find(r => r.milestones.includes("Debt free"))?.totalLeft).toBe(0);
  });
  it("adds an idea to the chosen extra amount", () => { expect(extraFromIdea({ extra: 100 }, 50)).toBe(150); });
  it("calculates months sooner rather than trusting AI", () => { expect(ideaImpact(profile.loans, {}, 100, now).monthsSooner).toBe(2); });
  it.each(["gambling", "crypto trading", "new loans"])("rejects %s suggestions", word => {
    expect(() => safeIdeas({ ideas: [1,2,3].map(() => ({title: word,detail: "Try it",monthlyAmount: 50,kind: "earn"})) })).toThrow();
  });
  it("keeps between 3 and 5 realistic bounded ideas", () => {
    const ideas = safeIdeas({ ideas: [1,2,3,4,5,6].map(() => ({ title: "Packed lunch", detail: "Use groceries you already buy.", monthlyAmount: 900, kind: "save" })) });
    expect(ideas).toHaveLength(5); expect(ideas[0]?.monthlyAmount).toBe(300);
    expect(() => safeIdeas({ ideas: ideas.slice(0,2) })).toThrow();
  });
});
describe("safeAdvice job tags", () => {
  const idea = (forJob: boolean, title = "Idea") => ({ title, detail: "A small step.", monthlyAmount: 23, kind: "earn" as const, forJob });
  it("tags job ideas with the cleaned job and lists them first", () => {
    const r = safeAdvice({ jobLabel: "Nurse", ideas: [idea(false, "g"), idea(true, "a"), idea(true, "b"), idea(true, "c")] });
    expect(r.ideas.map(i => i.tag)).toEqual(["Because you're a nurse", "Because you're a nurse", "Because you're a nurse", undefined]);
    expect(r.note).toBe(false);
    expect(r.ideas[0]!.monthlyAmount).toBe(20);
  });
  it("uses 'an' before vowels", () => {
    expect(safeAdvice({ jobLabel: "Uber driver", ideas: [idea(true), idea(true), idea(true)] }).ideas[0]!.tag).toBe("Because you're an uber driver");
  });
  it("shows the Settings note and no tags for an empty job", () => {
    const r = safeAdvice({ jobLabel: "", ideas: [idea(true), idea(false), idea(false)] });
    expect(r.note).toBe(true);
    expect(r.ideas.every(i => !i.tag)).toBe(true);
  });
  it("never repeats a rude job label", () => {
    const r = safeAdvice({ jobLabel: "shithead", ideas: [idea(true), idea(true), idea(true)] });
    expect(r.note).toBe(true);
    expect(r.ideas.every(i => !i.tag)).toBe(true);
  });
});
