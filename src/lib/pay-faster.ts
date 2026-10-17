import type { Loan, PlanOptions, PlanResult } from "./debt";
import { timeLabel } from "./time-label";

/** Display-only estimate: interpolate the final payment within its scheduled month.
 * The debt engine still owns interest, whole-month dates and saved plans. */
export function payoffDuration(result: PlanResult, loans: Loan[], options: PlanOptions = {}) {
  if (result.monthsLeft === null) return null;
  if (result.monthsLeft === 0) return 0;
  const final = result.schedule.at(-1);
  if (!final) return result.monthsLeft;
  const before = result.schedule.at(-2)?.totalLeft ?? loans.reduce((sum, loan) => sum + Math.max(0, loan.balance), 0);
  const budget = loans.reduce((sum, loan) => sum + loan.payment, 0) + Math.max(0, options.extra ?? 0)
    + (options.boost && result.monthsLeft <= options.boost.months ? Math.max(0, options.boost.amount) : 0);
  if (budget <= 0) return result.monthsLeft;
  return result.monthsLeft - 1 + Math.min(1, (before + final.interest) / budget);
}

export function comparePayoff(base: PlanResult, next: PlanResult, loans: Loan[], baseOptions: PlanOptions, nextOptions: PlanOptions) {
  const baseDuration = payoffDuration(base, loans, baseOptions);
  const nextDuration = payoffDuration(next, loans, nextOptions);
  const difference = baseDuration !== null && nextDuration !== null ? baseDuration - nextDuration : 0;
  const days = Math.round(Math.abs(difference) * 30.4375);
  const weeks = Math.round(days / 7);
  const unit = Math.abs(difference) >= 1 ? `About ${timeLabel(Math.round(Math.abs(difference)), "month")}`
    : days >= 7 ? `About ${weeks} ${weeks === 1 ? "week" : "weeks"}` : `About ${timeLabel(days, "day")}`;
  const time = days === 0 ? "Same payoff timing" : `${unit} ${difference >= 0 ? "sooner" : "later"}`;
  const scale = Math.max(baseDuration ?? 0, nextDuration ?? 0);
  return {
    baseDuration, nextDuration, days, difference, time,
    saving: Math.round((base.totalInterest - next.totalInterest) * 100) / 100,
    baseWidth: baseDuration === null ? null : scale > 0 ? baseDuration / scale * 100 : 0,
    nextWidth: nextDuration === null ? null : scale > 0 ? nextDuration / scale * 100 : 0,
  };
}

export function equivalentOrders(results: PlanResult[]) {
  const first = results[0];
  return !!first && results.every(result => result.monthsLeft === first.monthsLeft && Math.abs(result.totalInterest - first.totalInterest) < 0.01);
}

export const canCompareOrder = (loans: Loan[]) => loans.filter(loan => loan.balance > 0).length >= 2;