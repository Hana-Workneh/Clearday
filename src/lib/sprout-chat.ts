import { simulate, formatMonth, type PlanOptions } from "./debt";
import { money } from "./account-data";
import type { Profile } from "./store";

export const SPROUT_USER_LIMIT = 10;
export const SPROUT_DEMO_LIMIT = 5;
export const SPROUT_LIMIT_MESSAGE = "You've asked your questions for today. Come back tomorrow — Sprout will be here.";
export const suggestedQuestions = ["What if I pay $50 more?", "Which loan should I pay first?", "Can I afford a $300 phone?"];

export function chatFacts(profile: Profile, question: string, now = new Date()) {
  const options: PlanOptions = { ...profile.plan };
  if (profile.catchUp) {
    const from = new Date(profile.catchUp.from);
    const elapsed = (now.getFullYear() - from.getFullYear()) * 12 + now.getMonth() - from.getMonth();
    const remaining = profile.catchUp.months - elapsed;
    if (remaining > 0) options.boost = { amount: profile.catchUp.amount, months: remaining };
  }
  const current = simulate(profile.loans, now, options);
  const raw = question.match(/(?:\$|USD\s*)?([\d,]+(?:\.\d+)?)/i)?.[1];
  const amount = raw ? Number(raw.replaceAll(",", "")) : 50;
  const checked = Number.isFinite(amount) && amount >= 0 && amount <= 100000000 ? amount : 0;
  const monthly = profile.loans.filter(l => l.balance > 0).reduce((s, l) => s + l.payment, 0) + (options.extra ?? 0) + (options.boost?.amount ?? 0);
  const extraPlan = simulate(profile.loans, now, { ...options, extra: (options.extra ?? 0) + checked });
  const purchasePlan = simulate(profile.loans, now, { ...options, extra: (options.extra ?? 0) + checked / 12 });
  const active = profile.loans.filter(l => l.balance > 0);
  const priority = options.strategy === "order" ? active[0] : [...active].sort((a,b) => options.strategy === "snowball" ? a.balance - b.balance : b.rate - a.rate)[0];
  const cleanLoan = priority?.name.replace(/[^\p{L}\p{N} '\-]/gu, "").slice(0,120) || "your next loan";
  const facts: Record<string,string> = {
    date: current.debtFreeDate ? formatMonth(current.debtFreeDate) : "not yet within the calculation range",
    interest: money(current.totalInterest, profile.currency),
    income: money(profile.income, profile.currency),
    monthly: money(monthly, profile.currency),
    leftAfterDebt: money(profile.income - monthly, profile.currency),
    amount: money(checked, profile.currency),
    extraDate: extraPlan.debtFreeDate ? formatMonth(extraPlan.debtFreeDate) : "not yet within the calculation range",
    sooner: current.monthsLeft !== null && extraPlan.monthsLeft !== null ? String(Math.max(0,current.monthsLeft - extraPlan.monthsLeft)) : "an unknown number of",
    savedInterest: money(Math.max(0, current.totalInterest - extraPlan.totalInterest), profile.currency),
    purchaseAlternativeDate: purchasePlan.debtFreeDate ? formatMonth(purchasePlan.debtFreeDate) : "not yet within the calculation range",
    priorityLoan: cleanLoan,
    priorityRate: `${priority?.rate ?? 0}%`,
  };
  const fallback = /afford|buy|phone|purchase/i.test(question)
    ? "I can't say it's affordable without knowing your living costs and savings. Your income is {{income}} and planned debt payments are {{monthly}} a month, leaving {{leftAfterDebt}} before essentials. Keep essentials and a cash buffer safe; avoid borrowing for the {{amount}} purchase."
    : /first|order|priority/i.test(question)
      ? "Your chosen plan puts {{priorityLoan}} first. Keep the required payments on every loan; send any comfortable extra to that one. Your estimated debt free date is {{date}}."
      : /extra|more|what if/i.test(question)
        ? "With {{amount}} more each month, your estimated debt free date is {{extraDate}} — {{sooner}} months sooner, saving {{savedInterest}} in interest. Only add what feels comfortable after essentials."
        : "Your current estimated debt free date is {{date}}, with {{interest}} of interest still to pay. Keep essentials safe and make your planned payments. You can explore a comfortable extra without changing your saved plan.";
  return { facts, fallback, options, current, extraPlan, monthly };
}

export function checkedChatAnswer(text: string, facts: Record<string,string>, fallback: string) {
  const withoutTokens = text.replace(/\{\{\w+\}\}/g, "");
  const unsafe = /\d|[$€£]|\b(january|february|march|april|may|june|july|august|september|october|november|december|zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|gambl\w*|crypto\w*|betting|lottery|overdue|failed|behind)\b/i;
  const badToken = [...text.matchAll(/\{\{(\w+)\}\}/g)].some(m => !Object.hasOwn(facts, m[1] ?? ""));
  const candidate = !text.trim() || text.length > 900 || unsafe.test(withoutTokens) || badToken || /\b(take|apply|get|new)\b.{0,24}\b(loan|credit|borrow)/i.test(withoutTokens) ? fallback : text;
  return candidate.replace(/\{\{(\w+)\}\}/g, (_, key: string) => facts[key] ?? "");
}