import type { Profile } from "./store";

export function isDebtFree(profile: Pick<Profile, "loans">) {
  return profile.loans.length > 0 && profile.loans.every(loan => loan.balance <= 0);
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