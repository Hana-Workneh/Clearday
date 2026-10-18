import type { Profile } from "./store";
import { debtProgress } from "./progress";

export function isDebtFree(profile: Pick<Profile, "loans">) {
  return profile.loans.length > 0 && profile.loans.every(loan => loan.balance <= 0);
}

/** Display-only milestones; never changes a balance or a saved plan. */
export function nextWin(profile: Pick<Profile, "loans" | "payments">) {
  const { total: initial, paid } = debtProgress(profile.loans);
  if (initial <= 0) return null;
  const latest = [...(profile.payments ?? [])].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const before = Math.max(0, paid - (latest?.amount ?? 0));
  const milestones = [{ fraction: .1, name: "10% paid" }, { fraction: .25, name: "25% paid" }, { fraction: .5, name: "Halfway there" }, { fraction: 1, name: "Debt free" }];
  const reached = milestones.filter(m => paid >= initial * m.fraction && before < initial * m.fraction).at(-1);
  if (latest && reached) return { name: reached.name, reached: true, remaining: 0 };
  const next = milestones.find(m => paid < initial * m.fraction);
  return next ? { name: next.name, reached: false, remaining: Math.round((initial * next.fraction - paid) * 100) / 100 } : { name: "Debt free", reached: true, remaining: 0 };
}

export function celebrationStats(profile: Profile, now = new Date()) {
  const last = [...(profile.payments ?? [])].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const date = last ? new Date(`${last.date}T12:00:00`) : now;
  const planned = profile.startDebtFree ? new Date(profile.startDebtFree) : null;
  const monthsEarlier = planned && Number.isFinite(planned.getTime()) ? Math.max(0, (planned.getFullYear() - date.getFullYear()) * 12 + planned.getMonth() - date.getMonth()) : null;
  return { date, monthsEarlier, loansPaid: profile.loans.filter(l => l.balance <= 0).length, totalPaid: (profile.payments ?? []).reduce((sum, p) => sum + p.amount, 0) };
}

export function completedDemo(profile: Profile, now = new Date()): Profile {
  const date = now.toISOString().slice(0, 10);
  return { ...profile, loans: profile.loans.map(l => ({ ...l, balance: 0 })), payments: [...(profile.payments ?? []), ...profile.loans.filter(l => l.balance > 0).map(l => ({ id: `preview-${l.id}`, loanId: l.id, amount: l.balance, date }))] };
}