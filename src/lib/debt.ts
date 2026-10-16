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

export function simulate(loans: Loan[], start: Date = new Date()): PlanResult {
  const bal: Record<string, number> = {};
  loans.forEach((l) => (bal[l.id] = Math.max(0, l.balance)));
  const underwater = loans
    .filter((l) => bal[l.id] > 0 && l.payment <= monthlyInterest(bal[l.id], l.rate))
    .map((l) => ({ id: l.id, name: l.name, minPayment: Math.ceil(monthlyInterest(bal[l.id], l.rate) + 1) }));

  // highest interest first
  const order = [...loans].sort((a, b) => b.rate - a.rate);
  const schedule: ScheduleMonth[] = [];
  let totalInterest = 0;
  let month = 0;
  const left = () => Object.values(bal).reduce((s, v) => s + v, 0);

  while (left() > 0.005 && month < MAX_MONTHS) {
    month++;
    let pool = 0;
    let interestThisMonth = 0;
    for (const l of loans) {
      if (bal[l.id] <= 0) {
        pool += l.payment; // freed payment rolls over
        continue;
      }
      const i = monthlyInterest(bal[l.id], l.rate);
      interestThisMonth += i;
      bal[l.id] += i;
      const pay = Math.min(l.payment, bal[l.id]);
      bal[l.id] -= pay;
      pool += l.payment - pay; // leftover on a loan finishing this month
    }
    for (const l of order) {
      if (pool <= 0) break;
      const b = bal[l.id] ?? 0;
      if (b <= 0) continue;
      const pay = Math.min(pool, b);
      bal[l.id] -= pay;
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

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export const formatMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
