import { money } from "@/lib/account-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, Star, Plus, Flag, Leaf, HandCoins, Milestone, Trophy } from "lucide-react";
import { openPayment } from "@/components/PaymentFlow";
import { Sprout } from "@/components/Sprout";
import { Stone } from "@/components/Stone";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui/button";
import { simulate, formatMonth } from "@/lib/debt";
import { timeLabel } from "@/lib/time-label";
import { useProfile, planOptions, today } from "@/lib/store";

export const Route = createFileRoute("/_shell/progress")({
  head: () => ({
    meta: [
      { title: "Progress · Clearday" },
      { name: "description", content: "See your debt go down, your payments, and the badges you've earned." },
      { property: "og:title", content: "Progress · Clearday" },
      { property: "og:description", content: "See your debt go down, your payments, and the badges you've earned." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

const card = "leaf-lg border bg-card p-6";
const day = (s: string) =>
  new Date(s + (s.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", { month: "short", day: "numeric" });

type Stop = {
  id: string;
  name: string;
  pct: number;
  icon: "payment" | "leaf" | "milestone" | "trophy";
  meaning: string;
  reached: boolean;
  date?: string | undefined;
  toGo?: number | undefined;
};

function Progress() {
  const profile = useProfile();
  const usd = (n: number) => money(n, profile?.currency);
  const [openStop, setOpenStop] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);

  const data = useMemo(() => {
    if (!profile) return null;
    const now = new Date();
    const plan = simulate(profile.loans, now, planOptions(profile));
    const payments = [...(profile.payments ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const leftNow = profile.loans.reduce((s, l) => s + l.balance, 0);
    const paidLogged = payments.reduce((s, p) => s + p.amount, 0);
    const total = leftNow + paidLogged;
    const pct = total > 0 ? Math.min(100, Math.round((paidLogged / total) * 100)) : 100;

    // Per-loan original balance = what's left plus what was paid toward it.
    const paidByLoan = new Map<string, number>();
    for (const p of payments) paidByLoan.set(p.loanId, (paidByLoan.get(p.loanId) ?? 0) + p.amount);
    const loans = profile.loans.map((l) => {
      const original = l.balance + (paidByLoan.get(l.id) ?? 0);
      const loanPlan = simulate([l], now, planOptions(profile));
      return { ...l, original, paid: original - l.balance, paidOffBy: loanPlan.debtFreeDate };
    });

    // Cumulative paid after each payment, to date the percent stops.
    let cum = 0;
    const cumPoints = payments.map((p) => ({ date: p.date, cum: (cum += p.amount) }));
    const dateAt = (amount: number) => cumPoints.find((c) => c.cum >= amount)?.date;

    const firstPayment = payments[0];
    const paidOffLoan = loans.find((l) => l.balance <= 0 && l.original > 0);
    const loanStopPct = paidOffLoan
      ? Math.round((paidOffLoan.original / total) * 100)
      : loans.length > 0
        ? Math.round((Math.min(...loans.map((l) => l.original)) / total) * 100)
        : 50;

    const stops: Stop[] = [];
    if (firstPayment) {
      stops.push({
        id: "first", name: "First payment", icon: "payment",
        pct: Math.max(2, Math.round((firstPayment.amount / total) * 100)),
        meaning: "You made your first payment in Clearday. Every journey starts here.",
        reached: true, date: firstPayment.date,
      });
    } else {
      stops.push({
        id: "first", name: "First payment", icon: "payment", pct: 2,
        meaning: "You made your first payment in Clearday. Every journey starts here.",
        reached: false,
      });
    }
    for (const mark of [10, 25, 50, 75] as const) {
      const threshold = (mark / 100) * total;
      const reached = paidLogged >= threshold && total > 0;
      stops.push({
        id: `p${mark}`, name: mark === 50 ? "Halfway" : `${mark}% paid`, icon: mark === 50 ? "milestone" : "leaf",
        pct: mark,
        meaning:
          mark === 10 ? "One tenth of your debt is gone."
          : mark === 25 ? "A quarter of your debt is gone. Nice rhythm."
          : mark === 50 ? "Half your debt is gone. The rest gets easier."
          : "Three quarters gone. The finish line is close.",
        reached,
        date: reached ? dateAt(threshold) : undefined,
        toGo: reached ? undefined : Math.max(0, Math.round(threshold - paidLogged)),
      });
    }
    stops.push({
      id: "loan", name: "First loan paid off", icon: "trophy",
      pct: Math.min(96, Math.max(2, loanStopPct)),
      meaning: "One loan is fully gone. Its payment can now go to the next loan.",
      reached: !!paidOffLoan,
      date: paidOffLoan ? dateAt(paidLogged - paidOffLoan.balance) ?? payments[payments.length - 1]?.date : undefined,
      toGo: paidOffLoan ? undefined : undefined,
    });

    // Stops too close to each other (or to Sprout/Stone) show a marker only;
    // their full info lives in the popover.
    const allDoneNow = leftNow <= 0 && total > 0;
    const sproutPct = allDoneNow ? 88 : Math.min(pct, 86);
    const stonePct = allDoneNow ? -1 : Math.min(pct + 9, 88);
    const ordered = [...stops].sort((a, b) => a.pct - b.pct);
    const crowded = new Set<string>();
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i]!.pct - ordered[i - 1]!.pct < 11) crowded.add(ordered[i]!.id);
    }
    for (const s of stops) {
      if (Math.abs(s.pct - sproutPct) < 11 || (stonePct >= 0 && Math.abs(s.pct - stonePct) < 11)) crowded.add(s.id);
    }

    return { plan, payments: [...payments].reverse(), pct, total, paidLogged, leftNow, loans, stops, crowded };
  }, [profile]);

  useEffect(() => {
    if (data && data.pct >= 100 && data.leftNow <= 0 && data.total > 0) setConfetti(true);
  }, [data]);

  useEffect(() => {
    if (!openStop) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenStop(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openStop]);

  if (profile === undefined) return null;
  if (!profile || !data) {
    return (
      <div className={`${card} mx-auto max-w-xl text-center`}>
        <div className="flex justify-center"><Sprout mood="waving" size={110} /></div>
        <h1 className="mt-4 text-2xl font-semibold">Your progress will show up here.</h1>
        <Link to="/setup" className="btn-main mt-6 inline-block">Get started</Link>
      </div>
    );
  }

  const { plan, payments, pct, total, paidLogged, leftNow, loans, stops, crowded } = data;
  const allDone = leftNow <= 0 && total > 0;
  const startDate = profile.startDebtFree ? new Date(profile.startDebtFree) : null;
  const loanName = (id: string) => profile.loans.find((l) => l.id === id)?.name ?? "Loan";

  const soonerLabel = (() => {
    if (!startDate || !plan.debtFreeDate) return null;
    const days = Math.round((startDate.getTime() - plan.debtFreeDate.getTime()) / 86400000);
    if (days <= 6) return null;
    if (days < 31) {
      const weeks = Math.max(1, Math.round(days / 7));
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} sooner`;
    }
    return `${timeLabel(Math.round(days / 30.44), "month")} sooner`;
  })();

  const nextStopId = stops.find((s) => !s.reached)?.id;
  const openStopData = stops.find((s) => s.id === openStop);
  const stopIcon = (s: Stop, className: string) =>
    s.icon === "payment" ? <HandCoins className={className} />
    : s.icon === "milestone" ? <Milestone className={className} />
    : s.icon === "trophy" ? <Trophy className={className} />
    : <Leaf className={className} />;

  const sortedLoans = [...loans].sort((a, b) => Number(a.balance <= 0) - Number(b.balance <= 0));

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      {confetti && <Confetti />}
      <div className="flex items-center gap-4">
        <Sprout mood={allDone ? "crowned" : "cheering"} size={70} />
        <div>
          <h1 className="page-title">Look how far you've come</h1>
          <p className="page-sub mt-1">{pct}% of your debt paid. Every payment counts!</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="text-sm font-semibold text-muted-foreground">When you started</p>
          <p className="font-heading text-2xl font-bold">Debt free by {startDate ? formatMonth(startDate) : "—"}</p>
        </div>
        <div className={card}>
          <p className="text-sm font-semibold text-muted-foreground">Now</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-2xl font-bold">Debt free by {plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "—"}</p>
            {soonerLabel ? (
              <span className="rounded-full bg-chip-green px-2.5 py-1 text-[13px] font-bold text-chip-green-text">{soonerLabel}</span>
            ) : (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[13px] font-bold text-muted-foreground">Same as your plan</span>
            )}
          </div>
        </div>
      </div>

      {profile.demo && <Button asChild variant="outline" className="btn-secondary w-fit max-w-full whitespace-normal"><Link to="/debt-free" search={{preview: true}}>Preview the debt free moment</Link></Button>}

      <div className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Your road to debt free</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-chip-purple-text">{usd(paidLogged)}</span> of {usd(total)} paid
          </p>
        </div>

        <div className="road-panel mt-4" onClick={() => setOpenStop(null)}>
          {payments.length === 0 && !allDone && (
            <p className="road-hint-top text-sm font-semibold text-muted-foreground">Log your first payment to start moving.</p>
          )}
          <div className="road-scene">
            {/* The road */}
            <div className="road-track" aria-hidden="true">
              <div className="road-fill" style={{ "--p": `${pct}%` } as CSSProperties} />
            </div>

            {/* Stops */}
            {stops.map((s) => (
              <div key={s.id} className="road-stop" style={{ "--p": `${s.pct}%` } as CSSProperties}>
                <button
                  type="button"
                  aria-label={`${s.name}: ${s.reached ? `earned${s.date ? ` on ${day(s.date)}` : ""}` : s.toGo != null ? `${usd(s.toGo)} to go` : "not reached yet"}`}
                  aria-expanded={openStop === s.id}
                  onClick={(e) => { e.stopPropagation(); setOpenStop(openStop === s.id ? null : s.id); }}
                  className={`road-marker ${s.reached ? "road-marker-won" : s.id === nextStopId ? "road-marker-next" : "road-marker-later"}`}
                >
                  {s.reached ? <Check className="size-3.5" strokeWidth={3.5} /> : s.id === nextStopId ? <Star className="size-3.5 fill-current" /> : null}
                </button>
                {!crowded.has(s.id) && (
                  <div className="road-stop-label">
                    <span className="road-stop-name">{s.name}</span>
                    {s.reached && s.date && <span className="road-stop-sub">{day(s.date)}</span>}
                    {!s.reached && s.id === nextStopId && s.toGo != null && (
                      <span className="road-stop-sub">{usd(s.toGo)} to go</span>
                    )}
                  </div>
                )}
                {openStop === s.id && openStopData && (
                  <div
                    role="dialog"
                    aria-label={s.name}
                    className="road-popover leaf border bg-card p-4 text-left shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`leaf flex size-8 items-center justify-center ${s.reached ? "bg-chip-green text-chip-green-text" : s.id === nextStopId ? "bg-chip-yellow text-chip-yellow-text" : "bg-secondary text-muted-foreground"}`}>
                        {stopIcon(s, "size-4")}
                      </span>
                      <p className="font-semibold">{s.name}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.meaning}</p>
                    <p className="mt-2 text-[13px] font-bold">
                      {s.reached && s.date ? <span className="text-green-text">Earned on {day(s.date)}</span>
                        : s.reached ? <span className="text-green-text">Earned</span>
                        : s.toGo != null ? <span className="text-chip-yellow-text">{usd(s.toGo)} to go</span>
                        : <span className="text-muted-foreground">Not reached yet</span>}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Sprout at the end of the green fill */}
            <div className="road-sprout" style={{ "--p": `${allDone ? 88 : Math.min(pct, 86)}%` } as CSSProperties}>
              <p className="road-you leaf border bg-card font-bold">
                {allDone ? "You made it · 100%" : payments.length === 0 ? "You are here · Start" : `You are here · ${pct}% · ${usd(leftNow)} left`}
              </p>
              <Sprout mood={allDone ? "crowned" : "happy"} size={64} />
            </div>

            {/* Stone a little ahead, gone at 100% */}
            {!allDone && (
              <div className="road-stone" style={{ "--p": `${Math.min(pct + 9, 88)}%` } as CSSProperties}>
                <p className="road-stone-label">{usd(leftNow)} to go</p>
                <Stone size={pct > 90 ? 34 : 52} />
              </div>
            )}

            {/* Flag at the end of the road */}
            <div className="road-flag">
              <div className="road-flag-banner leaf border bg-card">
                <p className="text-[10px] font-bold tracking-wide text-chip-yellow-text">{allDone ? "DEBT FREE" : "DEBT FREE BY"}</p>
                {!allDone && <p className="font-heading text-sm font-bold leading-tight">{plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "—"}</p>}
              </div>
              <Flag className="road-flag-icon fill-sun text-sun" aria-hidden="true" />
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">Tap any stop to see what it means</p>

          {/* Badge chips */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {stops.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpenStop(openStop === s.id ? null : s.id)}
                className={`leaf flex items-center gap-1.5 border px-3 py-1.5 text-[13px] font-bold ${
                  s.reached ? "border-transparent bg-chip-green text-chip-green-text"
                  : s.id === nextStopId ? "border-transparent bg-chip-yellow text-chip-yellow-text"
                  : "bg-secondary text-muted-foreground"
                }`}
              >
                {s.reached ? <Check className="size-3.5" strokeWidth={3.5} /> : s.id === nextStopId ? <Star className="size-3.5 fill-current" /> : null}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-xl font-semibold">Loan by loan</h2>
        <ul className="mt-4 grid gap-4">
          {sortedLoans.map((l) => {
            const loanPct = l.original > 0 ? Math.min(100, Math.round((l.paid / l.original) * 100)) : 100;
            const done = l.balance <= 0;
            return (
              <li key={l.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold">
                    {l.name}
                    {done && <span className="flex items-center gap-1 rounded-full bg-chip-green px-2.5 py-0.5 text-[13px] font-bold text-chip-green-text"><Check className="size-3.5" strokeWidth={3.5} />Paid off</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{usd(l.paid)} of {usd(l.original)} paid</p>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-green transition-[width] duration-700 ease-out" style={{ width: `${loanPct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {done ? "Fully paid. Its payment now helps the next loan." : l.paidOffBy ? `Paid off by ${formatMonth(l.paidOffBy)}` : "Keep going, one payment at a time."}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={card}>
        <h2 className="text-xl font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-4 text-center">
            <Sprout mood="waving" size={90} />
            <p className="font-semibold">Your first payment will show up here</p>
            {!profile.demo && <Button className="btn-main" onClick={() => openPayment()}><Plus />I made a payment</Button>}
          </div>
        ) : (
          <ul className="mt-3 divide-y">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold">{loanName(p.loanId)}</p>
                  <p className="text-sm text-muted-foreground">{day(p.date)}</p>
                </div>
                <span className="font-heading font-bold text-green-text">{usd(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
