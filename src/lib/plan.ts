import { z } from "zod";
import { addMonths, simulate, type Loan, type PlanOptions } from "./debt";
import type { Profile } from "./store";
import { cleanText } from "./account-data";

export const adviceInputSchema = z.object({
  currency: z.enum(["USD", "RWF", "KES", "ETB"]).default("USD"),
  job: z.string().transform(cleanText).pipe(z.string().max(160)),
  income: z.number().finite().min(0).max(100000000),
  skills: z.string().transform(cleanText).pipe(z.string().max(160)).optional(),
  loans: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        name: z.string().max(120),
        balance: z.number().finite().min(0).max(100000000),
        startBalance: z.number().finite().min(0).max(100000000),
        rate: z.number().finite().min(0).max(1000),
        payment: z.number().finite().min(0).max(1000000),
      }),
    )
    .min(1)
    .max(30),
  plan: z.object({
    extra: z.number().finite().min(0).max(1000000).optional(),
    strategy: z.enum(["avalanche", "snowball", "order"]).optional(),
    boost: z
      .object({
        amount: z.number().finite().min(0).max(1000000),
        months: z.number().int().min(0).max(600),
      })
      .optional(),
  }),
});
export type AdviceInput = z.infer<typeof adviceInputSchema>;
/** Strict schema the AI must return. jobLabel is the cleaned job ("" when empty, unclear, a joke or offensive). */
export const adviceSchema = z
  .object({
    jobLabel: z.string(),
    ideas: z.array(
      z
        .object({
          title: z.string(),
          detail: z.string(),
          monthlyAmount: z.number(),
          kind: z.enum(["earn", "save"]),
          forJob: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();
const ideaSchema = z.object({
  title: z.string(),
  detail: z.string(),
  monthlyAmount: z.number(),
  kind: z.enum(["earn", "save"]),
  tag: z.string().max(120).optional(),
});
export type Idea = z.infer<typeof ideaSchema>;

const unsafe =
  /\b(gambl\w*|betting|lotter\w*|casino\w*|crypto\w*|bitcoin|forex|day trad\w*|new loans?|payday loans?|borrow\w*|refinanc\w*|leverage\w*|stock trad\w*|options trad\w*|multilevel|mlm)\b/i;
const rude =
  /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|dick\w*|porn\w*|whore\w*|slut\w*|nazi\w*|asshole\w*|bastard\w*|wank\w*|retard\w*)\b/i;
export function displayJob(value: string): string {
  const label = cleanText(value).trim();
  return rude.test(label) ? "" : label;
}
/** Keeps only safe ideas with rounded, capped monthly amounts (cached or fresh). */
export function safeIdeas(value: unknown): Idea[] {
  const parsed = z.object({ ideas: z.array(ideaSchema) }).parse(value);
  const ideas = parsed.ideas
    .filter(
      (i) =>
        !unsafe.test(`${i.title} ${i.detail}`) &&
        !rude.test(`${i.title} ${i.detail} ${i.tag ?? ""}`) &&
        i.monthlyAmount > 0 &&
        Number.isFinite(i.monthlyAmount),
    )
    .slice(0, 5)
    .map((i) => ({
      ...i,
      title: i.title.slice(0, 80),
      detail: i.detail.slice(0, 500),
      monthlyAmount: Math.min(300, Math.max(5, Math.floor(i.monthlyAmount / 5) * 5)),
    }));
  if (ideas.length < 3)
    throw new Error(
      "No safe suggestions were returned. Please generate a fresh set when you're ready.",
    );
  return ideas;
}
/** Turns the AI answer into tagged ideas. Job ideas come first; note=true asks the user to add a clearer job. */
export function safeAdvice(value: unknown, income?: number): { ideas: Idea[]; note: boolean } {
  const parsed = adviceSchema.parse(value);
  const label = cleanText(parsed.jobLabel).slice(0, 60);
  const usable = label.length > 1 && !rude.test(label);
  const sorted = [...parsed.ideas].sort((a, b) => Number(b.forJob) - Number(a.forJob));
  const ideas = safeIdeas({
    ideas: sorted.map(({ forJob, ...i }) => ({
      ...i,
      ...(usable && forJob
        ? { tag: `Because you're ${/^[aeiou]/i.test(label) ? "an" : "a"} ${label}` }
        : {}),
    })),
  }).map((idea) => ({
    ...idea,
    monthlyAmount:
      income === undefined
        ? idea.monthlyAmount
        : Math.min(idea.monthlyAmount, Math.max(5, Math.floor((income * 0.15) / 5) * 5)),
    detail:
      idea.kind === "earn" &&
      /freelanc|side work|mentor|code.review|template|tutor|course|gig|contract project|writing|audit/i.test(
        `${idea.title} ${idea.detail}`,
      ) &&
      !/check your contract before side work/i.test(idea.detail)
        ? `${idea.detail.slice(0, 420)} Check your contract before side work.`
        : idea.detail,
  }));
  return { ideas, note: !usable };
}

export function extraFromIdea(plan: PlanOptions, amount: number) {
  return Math.max(0, plan.extra ?? 0) + Math.max(0, amount);
}
/** Confirm the same extra shown in the preview, preserving the chosen loan order. */
export function planFromIdea(plan: PlanOptions, amount: number): PlanOptions {
  return { ...plan, extra: extraFromIdea(plan, amount) };
}
export function ideaImpact(loans: Loan[], plan: PlanOptions, amount: number, now: Date) {
  const current = simulate(loans, now, plan);
  const next = simulate(loans, now, { ...plan, extra: extraFromIdea(plan, amount) });
  return {
    monthsSooner:
      current.monthsLeft !== null && next.monthsLeft !== null
        ? Math.max(0, current.monthsLeft - next.monthsLeft)
        : null,
    nextDate: next.debtFreeDate,
  };
}

export type TimelineMonth = {
  date: Date;
  current: boolean;
  past: boolean;
  milestones: string[];
  totalLeft: number | null;
  logged: number;
  plannedPayment: number | null;
};
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
export function buildTimeline(profile: Profile, now: Date, options: PlanOptions): TimelineMonth[] {
  const result = simulate(profile.loans, now, options);
  const start = new Date(profile.startedAt ?? now);
  const elapsed = Math.max(
    0,
    Math.min(
      600,
      (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth(),
    ),
  );
  const payments = [...(profile.payments ?? [])]
    .filter((p) => new Date(p.date).getTime() <= now.getTime())
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = payments[0];
  const initial = profile.loans.reduce((sum, l) => sum + l.startBalance, 0);
  const balance = profile.loans.reduce((sum, l) => sum + l.balance, 0);
  const paidOff = profile.loans.some((l) => l.startBalance > 0 && l.balance <= 0);
  const rows: TimelineMonth[] = [];
  for (let n = -elapsed; n <= 0; n++) {
    const date = addMonths(now, n);
    const logged = payments
      .filter((p) => key(new Date(p.date)) === key(date))
      .reduce((s, p) => s + p.amount, 0);
    const milestones: string[] = [];
    if (first && key(new Date(first.date)) === key(date)) milestones.push("First payment");
    if (n === 0) {
      if (initial > 0 && balance <= initial / 2) milestones.push("Halfway");
      if (paidOff) milestones.push("First loan paid off");
      if (balance <= 0) milestones.push("Debt free");
    }
    rows.push({
      date,
      current: n === 0,
      past: n < 0,
      milestones,
      totalLeft: n === 0 ? balance : null,
      logged,
      plannedPayment: null,
    });
  }
  let firstLoanFound = paidOff;
  let halfwayFound = initial > 0 && balance <= initial / 2;
  let previous = balance;
  for (const month of result.schedule) {
    const milestones: string[] = [];
    if (!first && month.month === 1) milestones.push("First payment");
    if (
      !firstLoanFound &&
      profile.loans.some((l) => l.balance > 0 && (month.balances[l.id] ?? 0) === 0)
    ) {
      milestones.push("First loan paid off");
      firstLoanFound = true;
    }
    if (!halfwayFound && initial > 0 && month.totalLeft <= initial / 2) {
      milestones.push("Halfway");
      halfwayFound = true;
    }
    if (month.totalLeft === 0) milestones.push("Debt free");
    rows.push({
      date: month.date,
      current: false,
      past: false,
      milestones,
      totalLeft: month.totalLeft,
      logged: 0,
      plannedPayment: Math.max(0, previous + month.interest - month.totalLeft),
    });
    previous = month.totalLeft;
  }
  return rows;
}
