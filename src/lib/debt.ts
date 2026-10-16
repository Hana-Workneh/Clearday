export type Loan = {
  id: string;
  name: string;
  balance: number; // amount left to pay
  startBalance: number; // amount when first added, for progress
  rate: number; // yearly %
  payment: number; // monthly
};

export type ScheduleMonth = { month: number; date: Date; balances: Record<string, number>; interest: number; totalLeft: number };

export type PlanResult = {
  debtFreeDate: Date | null; // null when it can't be paid off within the cap
  monthsLeft: number | null;
  totalInterest: number;
  schedule: ScheduleMonth[];
  // loans whose payment doesn't cover the interest, with the minimum to start shrinking
  underwater: { id: string; name: string; minPayment: number }[];
};

export const MAX_MONTHS = 50 * 12;

export const monthlyInterest = (balance: number, rate: number) => balance * (rate / 100 / 12);

/** avalanche: highest rate first; snowball: smallest balance first; order: the order the loans were added. */
export type Strategy = "avalanche" | "snowball" | "order";
/** boost: a temporary extra amount for the first `months` months (used for "catch up slowly"). */
export type PlanOptions = { extra?: number | undefined; strategy?: Strategy | undefined; boost?: { amount: number; months: number } | undefined };

export function simulate(loans: Loan[], start: Date = new Date(), opts: PlanOptions = {}): PlanResult {
  const extra = Math.max(0, opts.extra ?? 0);
  const bal: Record<string, number> = {};
  loans.forEach((l) => (bal[l.id] = Math.max(0, l.balance)));
  const underwater = loans
    .filter((l) => (bal[l.id] ?? 0) > 0 && l.payment <= monthlyInterest(bal[l.id] ?? 0, l.rate))
    .map((l) => ({ id: l.id, name: l.name, minPayment: Math.ceil(monthlyInterest(bal[l.id] ?? 0, l.rate) + 1) }));

  // avalanche: highest interest first; snowball: smallest balance first
  const order =
    opts.strategy === "order"
      ? [...loans]
      : [...loans].sort((a, b) => (opts.strategy === "snowball" ? a.balance - b.balance || b.rate - a.rate : b.rate - a.rate));
  const schedule: ScheduleMonth[] = [];
  let totalInterest = 0;
  let month = 0;
  const left = () => Object.values(bal).reduce((s, v) => s + v, 0);

  while (left() > 0.005 && month < MAX_MONTHS) {
    month++;
    let pool = extra + (opts.boost && month <= opts.boost.months ? Math.max(0, opts.boost.amount) : 0);
    let interestThisMonth = 0;
    for (const l of loans) {
      let b = bal[l.id] ?? 0;
      if (b <= 0) {
        pool += l.payment; // freed payment rolls over
        continue;
      }
      const i = monthlyInterest(b, l.rate);
      interestThisMonth += i;
      b += i;
      const pay = Math.min(l.payment, b);
      bal[l.id] = b - pay;
      pool += l.payment - pay; // leftover on a loan finishing this month
    }
    for (const l of order) {
      if (pool <= 0) break;
      const b = bal[l.id] ?? 0;
      if (b <= 0) continue;
      const pay = Math.min(pool, b);
      bal[l.id] = b - pay;
      pool -= pay;
    }
    for (const id in bal) if ((bal[id] ?? 0) < 0.005) bal[id] = 0;
    totalInterest += interestThisMonth;
    schedule.push({ month, date: addMonths(start, month), balances: { ...bal }, interest: interestThisMonth, totalLeft: left() });
  }

  const done = left() <= 0.005;
  return {
    debtFreeDate: done ? addMonths(start, month) : null,
    monthsLeft: done ? month : null,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule,
    underwater,
  };
}

export function daysOfWork(totalInterest: number, monthlyIncome: number) {
  if (monthlyIncome <= 0) return 0;
  return Math.round(totalInterest / (monthlyIncome / 22));
}

/** Friendly label: one decimal under 1 day, "less than a day" when it rounds to 0. Never "0". */
export function workDaysLabel(totalInterest: number, monthlyIncome: number) {
  const exact = monthlyIncome > 0 ? totalInterest / (monthlyIncome / 22) : 0;
  if (exact < 1) {
    const one = Math.round(exact * 10) / 10;
    return one >= 0.1 ? `${one} days` : "less than a day";
  }
  const d = Math.round(exact);
  return `${d} ${d === 1 ? "day" : "days"}`;
}

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export const formatMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const DAY = 86400000;

/** Calendar days the debt free day moves closer after paying `amount`, based on how much goes to debt each month. */
export function daysCloser(amount: number, loans: Loan[], opts: PlanOptions = {}) {
  const monthly = loans.filter((l) => l.balance > 0).reduce((s, l) => s + l.payment, 0) + (opts.extra ?? 0);
  if (monthly <= 0 || amount <= 0) return 0;
  return Math.max(1, Math.round((amount / monthly) * 30.4));
}

export type PaymentLog = { loanId: string; date: string };

/** Loans with a balance and no payment logged for over a month (since the last payment, or since starting). */
export function quietLoans(loans: Loan[], payments: PaymentLog[], startedAt: string, now: Date, seen: Record<string, string> = {}) {
  return loans.filter((l) => {
    if (l.balance <= 0) return false;
    const last = payments.filter((p) => p.loanId === l.id).map((p) => p.date).sort().pop() ?? startedAt;
    if (seen[l.id] && seen[l.id]! >= last) return false; // already handled this quiet stretch
    return now.getTime() - new Date(last).getTime() > 31 * DAY;
  });
}

/** Old vs new date when one month's payment on `loanId` was skipped. */
export function skippedMonth(loans: Loan[], loanId: string, start: Date, opts: PlanOptions = {}) {
  const grown = loans.map((l) => (l.id === loanId ? { ...l, balance: l.balance + monthlyInterest(l.balance, l.rate) } : l));
  const paid = loans.map((l) =>
    l.id === loanId ? { ...l, balance: Math.max(0, l.balance + monthlyInterest(l.balance, l.rate) - l.payment) } : l,
  );
  return { grown, oldDate: simulate(paid, start, opts).debtFreeDate, newDate: simulate(grown, start, opts).debtFreeDate };
}

/** Smallest extra (in $5 steps) for the next `months` months that brings the date back to `target`. */
export function catchUpAmount(loans: Loan[], target: Date, start: Date, opts: PlanOptions = {}, months = 3) {
  for (let a = 5; a <= 2000; a += 5) {
    const d = simulate(loans, start, { ...opts, boost: { amount: a, months } }).debtFreeDate;
    if (d && d.getTime() <= target.getTime()) return a;
  }
  return null;
}
