import type { Loan } from "./debt";
const cents = (n: number) => Math.round(n * 100) / 100;
/** Principal progress; gross logged payments may include interest. */
export function debtProgress(loans: Pick<Loan, "startBalance" | "balance">[]) {
  const total = cents(loans.reduce((s, l) => s + l.startBalance, 0));
  const left = cents(loans.reduce((s, l) => s + l.balance, 0));
  const paid = cents(Math.max(0, total - left));
  const exactPercent = total > 0 ? Math.min(100, paid / total * 100) : 0;
  return { total, left, paid, exactPercent, percent: Math.round(exactPercent) };
}
/** Weight dated history by each loan's actual principal reduction, excluding interest. */
export function principalHistory(loans: Loan[], payments: { loanId: string; amount: number; date: string }[]) {
  const logged = new Map<string, number>();
  for (const p of payments) logged.set(p.loanId, (logged.get(p.loanId) ?? 0) + p.amount);
  const principal = new Map(loans.map(l => [l.id, debtProgress([l]).paid]));
  let cumulative = 0;
  return [...payments].sort((a, b) => a.date.localeCompare(b.date)).map(p => {
    const gross = logged.get(p.loanId) ?? 0;
    cumulative += gross > 0 ? p.amount / gross * (principal.get(p.loanId) ?? 0) : 0;
    return { date: p.date, cumulative: cents(cumulative) };
  });
}