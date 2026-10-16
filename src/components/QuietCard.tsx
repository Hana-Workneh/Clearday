import { useMemo } from "react";
import { Sprout } from "@/components/Sprout";
import { openPayment } from "@/components/PaymentFlow";
import { quietLoans, skippedMonth, catchUpAmount, formatMonth, usd } from "@/lib/debt";
import { saveProfile, planOptions, today, type Profile } from "@/lib/store";

const MONTHS = 3;

/** Kind card shown when a loan has had no payment logged for over a month. */
export function QuietCard({ profile }: { profile: Profile }) {
  const info = useMemo(() => {
    const now = new Date();
    const loan = quietLoans(profile.loans, profile.payments ?? [], profile.startedAt ?? today(), now, profile.quietSeen)[0];
    if (!loan) return null;
    const opts = planOptions(profile, now);
    const { grown, oldDate, newDate } = skippedMonth(profile.loans, loan.id, now, opts);
    const catchUp = oldDate ? catchUpAmount(grown, oldDate, now, opts, MONTHS) : null;
    return { loan, grown, oldDate, newDate, catchUp };
  }, [profile]);

  if (!info) return null;
  const { loan, grown, oldDate, newDate, catchUp } = info;
  const same = oldDate && newDate && oldDate.getTime() === newDate.getTime();

  const choose = (slow: boolean) =>
    saveProfile({
      ...profile,
      loans: grown,
      quietSeen: { ...profile.quietSeen, [loan.id]: today() },
      ...(slow && catchUp ? { catchUp: { amount: catchUp, months: MONTHS, from: today() } } : {}),
    });

  return (
    <div className="leaf-lg border bg-card p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <Sprout mood="calm" size={90} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">No {loan.name} payment this month. That's okay, it happens.</h2>
          {same ? (
            <p className="mt-2 text-muted-foreground">Good news: your date stays at {formatMonth(oldDate!)}.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="leaf bg-secondary px-4 py-2">Was: <b>{oldDate ? formatMonth(oldDate) : "—"}</b></span>
              <span className="leaf bg-secondary px-4 py-2">Now: <b>{newDate ? formatMonth(newDate) : "Let's tweak"}</b></span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {catchUp && !same && (
          <button onClick={() => choose(true)} className="leaf bg-primary px-5 py-3.5 text-left text-primary-foreground transition hover:opacity-90">
            <span className="block font-semibold">Catch up slowly</span>
            <span className="text-sm opacity-80">Add {usd(catchUp)} a month for {MONTHS} months to get back to {formatMonth(oldDate!)}.</span>
          </button>
        )}
        <button onClick={() => choose(false)} className="leaf border-[1.5px] border-line-strong bg-card px-5 py-3.5 text-left transition hover:bg-secondary">
          <span className="block font-semibold">Keep going as normal</span>
          <span className="text-sm text-muted-foreground">{same ? "Nothing changes." : `Your date moves to ${newDate ? formatMonth(newDate) : "later"}.`}</span>
        </button>
      </div>
      <button onClick={() => openPayment(loan.id)} className="mt-4 text-sm font-semibold text-green-text underline-offset-4 hover:underline">
        I did pay, let me add it
      </button>
    </div>
  );
}
