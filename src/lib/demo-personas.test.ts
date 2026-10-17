import { describe, it, expect } from "vitest";
import { createDemoPersona, demoIdeas, demoPersonas } from "./demo-personas";
import { safeAdvice } from "./plan";
import { profileSchema } from "./account-data";
import { simulate } from "./debt";

describe("Demo personas", () => {
  it("calculates the truthful effect of $75 extra from Hana's unchanged demo loans", () => {
    const now = new Date(2026, 9, 17);
    const hana = createDemoPersona("hana", now);
    const current = simulate(hana.loans, now, hana.plan);
    const faster = simulate(hana.loans, now, { ...hana.plan, extra: 75 });
    expect(current.monthsLeft).toBe(3);
    expect(faster.monthsLeft).toBe(2);
    expect(current.totalInterest - faster.totalInterest).toBeCloseTo(2.08, 2);
  });
  it("offers Hana, Kofi, Maya and Grace with Hana first", () => {
    expect(demoPersonas.map((p) => p.name)).toEqual(["Hana", "Kofi", "Maya", "Grace"]);
    expect(demoPersonas.map((p) => p.job.toLowerCase())).toEqual([
      "marketing officer",
      "software developer",
      "product designer",
      "nurse",
    ]);
  });
  it.each(demoPersonas)(
    "gives $name four distinct months of valid private sample history",
    (persona) => {
      const p = createDemoPersona(persona.id, new Date(2026, 9, 17));
      expect(profileSchema.safeParse(p).success).toBe(true);
      expect(p.demo).toBe(true);
      expect(p.demoPersona).toBe(persona.id);
      expect(new Set(p.payments?.map((payment) => payment.date.slice(0, 7))).size).toBe(4);
      expect(p.loans.every((l) => l.id.startsWith(persona.id))).toBe(true);
      const ideas = demoIdeas(p);
      expect(ideas).toHaveLength(5);
      expect(ideas.filter((i) => i.tag).length).toBeGreaterThanOrEqual(3);
      expect(ideas.every((i) => i.monthlyAmount <= p.income * 0.15 && i.monthlyAmount <= 300)).toBe(
        true,
      );
    },
  );
  it("creates independent loan and payment objects for each browser snapshot", () => {
    const a = createDemoPersona("kofi");
    const b = createDemoPersona("kofi");
    const loan = a.loans[0];
    if (loan) loan.balance = 0;
    expect(b.loans[0]?.balance).toBeGreaterThan(0);
    expect(a.payments).not.toBe(b.payments);
  });
  it("caps fresh AI estimates to fifteen percent of monthly income", () => {
    const r = safeAdvice(
      {
        jobLabel: "software developer",
        ideas: [1, 2, 3, 4, 5].map((i) => ({
          title: `Project ${i}`,
          detail: "A freelance project.",
          monthlyAmount: 300,
          kind: "earn",
          forJob: true,
        })),
      },
      500,
    );
    expect(r.ideas.map((i) => i.monthlyAmount)).toEqual([75, 75, 75, 75, 75]);
  });
  it("requires a contract reminder for freelance side-work suggestions", () => {
    const r = safeAdvice({
      jobLabel: "software developer",
      ideas: [1, 2, 3].map((i) => ({
        title: `Project ${i}`,
        detail: "Offer a freelance project.",
        monthlyAmount: 100,
        kind: "earn",
        forJob: true,
      })),
    });
    expect(r.ideas.every((i) => /check your contract before side work/i.test(i.detail))).toBe(true);
  });
});
