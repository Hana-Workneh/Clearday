import { simulate, formatMonth, type PlanOptions } from "./debt";
import { money } from "./account-data";
import type { Profile } from "./store";
import { correctTimeUnits } from "./time-label";

export const SPROUT_USER_LIMIT = 10;
export const SPROUT_DEMO_LIMIT = 15;
export const SPROUT_DEMO_TOTAL_LIMIT = 500;
export const SPROUT_LIMIT_MESSAGE =
  "You've asked your questions for today. Come back tomorrow — Sprout will be here.";
export const suggestedQuestions = [
  "What if I pay $50 more?",
  "Which loan should I pay first?",
  "Can I afford a $300 phone?",
];

export function chatFacts(profile: Profile, question: string, now = new Date()) {
  const options: PlanOptions = { ...profile.plan };
  if (profile.catchUp) {
    const from = new Date(profile.catchUp.from);
    const elapsed =
      (now.getFullYear() - from.getFullYear()) * 12 + now.getMonth() - from.getMonth();
    const remaining = profile.catchUp.months - elapsed;
    if (remaining > 0) options.boost = { amount: profile.catchUp.amount, months: remaining };
  }
  const current = simulate(profile.loans, now, options);
  const raw = question.match(/(?:\$|USD\s*)?([\d,]+(?:\.\d+)?)\s*(k\b|thousand\b)?/i);
  const amount = raw?.[1] ? Number(raw[1].replaceAll(",", "")) * (raw[2] ? 1000 : 1) : 50;
  const checked = Number.isFinite(amount) && amount >= 0 && amount <= 100000000 ? amount : 0;
  const raise = /raise|salary increase|pay rise|promotion/i.test(question);
  const net = /net|take.home|after.tax/i.test(question);
  const isMonthly = /monthly|per month|a month|each month/i.test(question);
  const extraAmount = raise ? (checked / (isMonthly ? 1 : 12)) * (net ? 1 : 0.7) : checked;
  const freelance = /freelanc|contract project|side work|side gig/i.test(question);
  const hasAmount = !!raw;
  const monthly = profile.loans.some((l) => l.balance > 0)
    ? profile.loans.reduce((s, l) => s + l.payment, 0) +
      (options.extra ?? 0) +
      (options.boost?.amount ?? 0)
    : 0;
  const extraPlan = simulate(profile.loans, now, {
    ...options,
    extra: (options.extra ?? 0) + extraAmount,
  });
  const active = profile.loans.filter((l) => l.balance > 0);
  const priority =
    options.strategy === "order"
      ? active[0]
      : [...active].sort((a, b) =>
          options.strategy === "snowball" ? a.balance - b.balance : b.rate - a.rate,
        )[0];
  const cleanLoan =
    priority?.name.replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 120) || "your next loan";
  const facts: Record<string, string> = {
    balance: money(active.reduce((sum, loan) => sum + loan.balance, 0), profile.currency),
    date: current.debtFreeDate
      ? formatMonth(current.debtFreeDate)
      : "not yet within the calculation range",
    interest: money(current.totalInterest, profile.currency),
    income: money(profile.income, profile.currency),
    monthly: money(monthly, profile.currency),
    leftAfterDebt: money(profile.income - monthly, profile.currency),
    amount: money(checked, profile.currency),
    extraMonthly: money(extraAmount, profile.currency),
    grossMonthly: money(checked / (isMonthly ? 1 : 12), profile.currency),
    taxAssumption: "30%",
    extraDate: extraPlan.debtFreeDate
      ? formatMonth(extraPlan.debtFreeDate)
      : "not yet within the calculation range",
    sooner:
      current.monthsLeft !== null && extraPlan.monthsLeft !== null
        ? String(Math.max(0, current.monthsLeft - extraPlan.monthsLeft))
        : "an unknown number of",
    savedInterest: money(
      Math.max(0, current.totalInterest - extraPlan.totalInterest),
      profile.currency,
    ),
    priorityLoan: cleanLoan,
    priorityRate: `${priority?.rate ?? 0}%`,
  };
  const fallback =
    raise && !hasAmount
      ? "What is the raise amount, is it annual or monthly, and is it before tax or take-home? I can compare your actual extra monthly take-home pay with your current estimated free date of {{date}}."
      : raise
        ? (net
            ? "If that raise is take-home pay"
            : "Assuming that raise is before tax, this illustration sets aside {{taxAssumption}} for taxes; your actual tax may differ") +
          (isMonthly ? ", and arrives monthly" : ", and is an annual raise") +
          ", it adds about {{extraMonthly}} a month. If you put all of that extra toward debt after essentials, your estimated free date is {{extraDate}} — {{sooner}} months sooner, saving {{savedInterest}} in interest. A raise is not guaranteed; use your actual take-home increase before changing your plan."
        : freelance
          ? hasAmount && !/one.off|one.time|single project/i.test(question)
            ? "A small, clearly scoped freelance project could help if the work fits your schedule. If {{amount}} is your reliable monthly take-home gain after costs and tax, adding it to debt gives an estimated free date of {{extraDate}} — {{sooner}} months sooner, saving {{savedInterest}} in interest. Check your contract before side work, keep employer code and data private, and protect essentials. One-off income needs a different calculation."
            : "A small, clearly scoped freelance project can help, but check your contract before side work. Protect your rest and never use employer code or confidential data. What would you keep each month after costs and tax, and is the project recurring or one-off? I can compare that with your current free date of {{date}}."
          : /explain|how.*work|understand.*plan|what.*plan/i.test(question)
            ? "Your plan estimates monthly interest, then subtracts your planned payments of {{monthly}}. Comfortable extra goes to {{priorityLoan}}; payments from completed loans help the remaining loans. Your estimated debt free date is {{date}}. Clearday does not move money."
          : /budget|living cost|essentials|spend|save money/i.test(question)
            ? "Your income is {{income}} and planned debt payments are {{monthly}}, leaving {{leftAfterDebt}} before living costs. Start with essentials and a cash buffer, then decide whether a little extra is comfortable. What are your main monthly living costs?"
          : /balance|how much.*owe|total debt|debt left/i.test(question)
            ? "Your current loans have {{balance}} left. Your planned payments are {{monthly}} each month, and your estimated debt free date is {{date}}. Ask about extra payments or your loan order to compare next steps."
          : /afford|buy|purchase|can i.*phone/i.test(question)
            ? "I can't say it's affordable without knowing your living costs and savings. Your income is {{income}} and planned debt payments are {{monthly}} a month, leaving {{leftAfterDebt}} before essentials. Keep essentials and a cash buffer safe; avoid borrowing for the {{amount}} purchase."
            : /first|order|priority/i.test(question)
              ? "Your chosen plan puts {{priorityLoan}} first. Keep the required payments on every loan; send any comfortable extra to that one. Your estimated debt free date is {{date}}."
              : /extra|more|what if/i.test(question)
                ? "With {{amount}} more each month, your estimated debt free date is {{extraDate}} — {{sooner}} months sooner, saving {{savedInterest}} in interest. Only add what feels comfortable after essentials."
                : "I can help with this plan's date, loan order, extra payments and budgeting. Your current estimated debt free date is {{date}}, with {{interest}} of interest still to pay. What would you like to understand? Keep essentials safe; you can preview a comfortable extra without changing your saved plan.";
  return { facts, fallback, options, current, extraPlan, monthly, extraAmount };
}

export function checkedChatAnswer(text: string, facts: Record<string, string>, fallback: string) {
  const withoutTokens = text.replace(/\{\{\w+\}\}/g, "");
  const unsafe =
    /\d|[$€£]|\b(january|february|march|april|may|june|july|august|september|october|november|december|zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|gambl\w*|crypto\w*|betting|lottery|overdue|failed|behind)\b/i;
  const badToken = [...text.matchAll(/\{\{(\w+)\}\}/g)].some(
    (m) => !Object.hasOwn(facts, m[1] ?? ""),
  );
  const candidate =
    !text.trim() ||
    text.length > 900 ||
    unsafe.test(withoutTokens) ||
    badToken ||
    /\b(take|apply|get|new)\b.{0,24}\b(loan|credit|borrow)/i.test(withoutTokens)
      ? fallback
      : text;
  return correctTimeUnits(candidate.replace(/\{\{(\w+)\}\}/g, (_, key: string) => facts[key] ?? ""));
}
