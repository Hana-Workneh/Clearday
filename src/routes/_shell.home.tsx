import { money } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoanMenu } from "@/components/LoanMenu";
import { useMemo } from "react";
import { ArrowRight, Check, Sparkles, CircleDollarSign, BriefcaseBusiness, Star } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { simulate, formatMonth, workDaysLabel } from "@/lib/debt";
import { useProfile, planOptions, percentPaid } from "@/lib/store";
import { QuietCard } from "@/components/QuietCard";
import { DebtFreeMoment } from "@/components/DebtFreeMoment";
import { isDebtFree, nextWin } from "@/lib/celebration";
import { ideaImpact, extraFromIdea } from "@/lib/plan";
import { StartHere } from "@/components/StartHere";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/home")({
  head: () => ({
    meta: [
      { title: "Home · Clearday" },
      { name: "description", content: "Your loans and your debt free date, all in one place." },
      { property: "og:title", content: "Home · Clearday" },
      { property: "og:description", content: "Your loans and your debt free date, all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const card = "leaf-lg border bg-card p-6";

function Home() {
  const profile = useProfile();
  const usd = (n: number) => money(n, profile?.currency);
  const plan = useMemo(() => (profile ? simulate(profile.loans, new Date(), planOptions(profile)) : null), [profile]);

  if (profile === undefined) return null;
  if (!profile || !plan) {
    return (
      <div className={`${card} mx-auto max-w-xl text-center`}>
        <div className="flex justify-center"><Sprout mood="waving" size={110} /></div>
        <h1 className="mt-4 text-2xl font-semibold">Hi there! Let's find your free day.</h1>
        <p className="mt-2 text-muted-foreground">It only takes a couple of minutes.</p>
        <Link to="/setup" className="btn-main mt-6 inline-block">Get started</Link>
      </div>
    );
  }

  const pct = percentPaid(profile.loans);
  if (isDebtFree(profile)) return <DebtFreeMoment profile={profile} />;
  const filled = Math.round(pct / 10);
  const win = nextWin(profile);
  const options = planOptions(profile);
  const tipAmount = 20;
  const impact = ideaImpact(profile.loans, options, tipAmount, new Date());
  const closest = profile.loans.filter(l => l.balance > 0 && l.startBalance > 0).reduce<typeof profile.loans[number] | undefined>((best, loan) => !best || loan.balance / loan.startBalance < best.balance / best.startBalance ? loan : best, undefined);
  const lastPayment = [...(profile.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  const elapsed = lastPayment ? Math.max(0, Math.round((new Date().setHours(0, 0, 0, 0) - new Date(`${lastPayment.date}T00:00:00`).getTime()) / 86400000)) : null;
  const greeting = elapsed === null ? "Every payment brings your free day closer." : elapsed === 0 ? "You logged a payment today. Nice work." : elapsed === 1 ? "You logged a payment yesterday. Nice work." : `You logged a payment ${elapsed} days ago. Nice work.`;

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex items-center gap-4">
        <Sprout mood="happy" size={70} />
        <div>
          <h1 className="page-title">Hi {profile.name}!</h1>
          <p className="page-sub mt-2">{greeting}</p>
        </div>
      </div>

      {!profile.demo && <StartHere hasPayment={(profile.payments ?? []).length > 0} />}

      <QuietCard profile={profile} />

      {win && <div role="status" className="chip-yellow w-fit max-w-full"><Star aria-hidden className="size-4 shrink-0 fill-sun text-sun" /><span>{win.reached ? `You reached ${win.name}!` : `Next win: ${win.name}, ${usd(win.remaining)} to go`}</span></div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className={`${card} flex min-h-64 min-w-0 flex-col justify-between md:p-8`} aria-label="Your debt free date">
          <div><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-muted-foreground">Debt free by</p><Sparkles className="size-5 text-sun" /></div>
          <p className="big-date mt-4 break-words animate-in fade-in zoom-in-95 duration-700">
            {plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "Not yet — let's tweak"}
          </p>
          {plan.monthsLeft && <p className="mt-3 text-sm text-muted-foreground">{plan.monthsLeft} months to go</p>}</div>
          <div className="mt-7"><div className="flex gap-1.5 sm:gap-2" role="progressbar" aria-label="Debt paid" aria-valuenow={Math.max(0, Math.min(100, pct))} aria-valuemin={0} aria-valuemax={100}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-3.5 min-w-0 flex-1 rounded-full ${i < filled ? "bg-green" : pct === 0 && i === 0 ? "bg-green/40 animate-pulse" : "bg-track"}`} />
            ))}
          </div><p className="mt-3 text-sm font-semibold">{pct === 0 ? "Day 1. Your first payment fills the first pill." : `${pct}% of the way there`}</p></div>
        </section>
        <div className="grid min-w-0 gap-5">
          <div className={`${card} flex min-w-0 flex-col justify-between gap-4 md:p-7`}>
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-muted-foreground">Days of work to pay interest</p><span className="grid size-10 shrink-0 place-items-center rounded-full bg-chip-purple text-chip-purple-text"><BriefcaseBusiness className="size-5" /></span></div>
            <p className="big-date break-words">{workDaysLabel(plan.totalInterest, profile.income)}</p>
            <p className="font-heading text-lg font-semibold leading-snug">You'll work {workDaysLabel(plan.totalInterest, profile.income)} just to pay interest.</p>
          </div>
          <div className={`${card} flex min-w-0 items-center justify-between gap-4 !py-5`}>
            <div><p className="text-sm font-semibold text-muted-foreground">Interest still to pay</p>
            <p className="mt-1 break-words font-heading text-2xl font-bold">{usd(plan.totalInterest)}</p></div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-track text-muted-foreground"><CircleDollarSign className="size-5" /></span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className={`${card} min-w-0 md:p-8`} aria-label="Your loans">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your loans</h2>
            <Link to="/setup" className="text-sm font-semibold text-green-text">Edit</Link>
          </div>
          <ul className="mt-6 divide-y">
            {profile.loans.map((l) => {
              const p = l.startBalance > 0 ? Math.max(0, Math.min(100, Math.round(((l.startBalance - l.balance) / l.startBalance) * 100))) : 0;
              const highlighted = l.id === closest?.id;
              const uw = plan.underwater.find((u) => u.id === l.id);
              return (
                <li key={l.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className={`break-words font-semibold ${highlighted ? "text-green-text" : ""}`}>{l.name}</span>
                    {highlighted && <span className="chip-green !px-2.5 !py-1 text-xs"><Sparkles className="mr-1 size-3" />Closest to done</span>}
                    {l.balance === 0 && <span className="chip-green !px-2.5 !py-1 text-xs"><Check className="mr-1 size-3" />Paid off</span>}
                    <span className="ml-auto -my-2"><LoanMenu loan={l} onEdit={() => navigate({ to: "/setup", search: { step: 1, edit: l.id } })} /></span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs"><span className="text-muted-foreground">{usd(l.balance)} left</span><span className={`font-bold ${highlighted ? "text-green-text" : "text-muted-foreground"}`}>{p}% paid</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-track" role="progressbar" aria-label={`${l.name} paid`} aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-green" style={{ width: `${p}%` }} />
                  </div>
                  {uw && <p className="mt-2 text-sm text-tip">This payment doesn't cover the interest yet. Paying at least {usd(uw.minPayment)} a month will start shrinking it.</p>}
                </li>
              );
            })}
          </ul>
        </section>
        <aside className="leaf-lg flex min-w-0 flex-col gap-6 bg-tip-solid p-7 text-tip-foreground md:p-8">
          <div className="flex items-center justify-between gap-3"><p className="font-heading text-lg font-semibold">Sprout's tip</p><Sprout mood="thinking" size={78} /></div>
          <p className="font-heading text-2xl font-semibold leading-snug">Pay {usd(tipAmount)} more a month{impact.monthsSooner !== null && impact.monthsSooner > 0 ? ` and be debt free ${impact.monthsSooner} ${impact.monthsSooner === 1 ? "month" : "months"} sooner.` : impact.nextDate ? ` and work towards ${formatMonth(impact.nextDate)}.` : " and bring your free day closer."}</p>
          <Button asChild variant="link" className="group mt-auto h-auto justify-start whitespace-normal p-0 text-left text-tip-foreground"><Link to="/pay-faster" search={{ extra: extraFromIdea(options, tipAmount) }}>See ways to pay faster <ArrowRight className="shrink-0 transition group-hover:translate-x-1" /></Link></Button>
        </aside>
      </div>
    </div>
  );
}
