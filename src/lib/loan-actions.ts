import type { Profile } from "./store";

/** Removes a loan and every payment logged against it. */
export function removeLoan<P extends Pick<Profile, "loans" | "payments">>(profile: P, loanId: string): P {
  return { ...profile, loans: profile.loans.filter((l) => l.id !== loanId), payments: (profile.payments ?? []).filter((p) => p.loanId !== loanId) };
}

/** Marks a loan paid off by logging its remaining balance as a final payment. */
export function markPaidOff<P extends Pick<Profile, "loans" | "payments">>(profile: P, loanId: string, date: string, id: string): P {
  const loan = profile.loans.find((l) => l.id === loanId);
  if (!loan || loan.balance <= 0) return profile;
  return {
    ...profile,
    loans: profile.loans.map((l) => (l.id === loanId ? { ...l, balance: 0 } : l)),
    payments: [...(profile.payments ?? []), { id, loanId, amount: loan.balance, date }],
  };
}
