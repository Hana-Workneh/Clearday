import { nextWin } from "./celebration";
import { percentPaid, type Profile } from "./store";

/** Display only: reuse shared progress and milestone calculations. */
export function homeGreeting(profile: Profile, now = new Date()) {
  const initial = profile.loans.reduce((sum, loan) => sum + loan.startBalance, 0);
  const remaining = profile.loans.reduce((sum, loan) => sum + loan.balance, 0);
  const rawPercent = initial > 0 ? (initial - remaining) / initial * 100 : 0;
  const percent = Math.max(0, Math.min(100, percentPaid(profile.loans)));
  const last = [...(profile.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const days = last ? Math.max(0, Math.round((midnight.getTime() - new Date(`${last.date}T00:00:00`).getTime()) / 86400000)) : null;
  const recency = days === null ? "Log your first payment to get Sprout moving." : days === 0 ? "You logged a payment today. Keep it going." : days === 1 ? "You logged a payment yesterday. Keep it going." : `You logged a payment ${days} days ago. Keep it going.`;
  return { showPercent: rawPercent >= 1, percent, recency, cheering: !!nextWin(profile)?.reached };
}