import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { simulate, formatMonth, usd, daysOfWork } from "@/lib/debt";
import { useProfile, planOptions, percentPaid } from "@/lib/store";
import { QuietCard } from "@/components/QuietCard";

export const Route = createFileRoute("/_shell/home")({
  head: () => ({
    meta: [
      { title: "Home · Clearday" },
      { name: "description", content: "Your loans and your debt free date, all in one place." },
      { property: "og:title", content: "Home · Clearday" },
      { property: "og:description", content: "Your loans and your debt free date, all in one place." },
    ],
  }),
  component: Home,
});

const card = "leaf-lg border bg-card p-6";

function Home() {
  const profile = useProfile();
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
  const filled = Math.round(pct / 10);

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <div className="flex items-center gap-4">
        <Sprout mood="happy" size={70} />
        <div>
          <h1 className="text-3xl font-semibold">Hi {profile.name}!</h1>
          <p className="text-muted-foreground">Every payment brings your free day closer.</p>
        </div>
      </div>

      <QuietCard profile={profile} />

      <div className="grid gap-5 md:grid-cols-3">
        <div className={`${card} md:col-span-2`}>
          <p className="text-sm font-semibold text-muted-foreground">Debt free by</p>
          <p className="mt-1 font-heading text-4xl font-bold text-green-text animate-in fade-in zoom-in-95 duration-700 md:text-5xl">
            {plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "Not yet — let's tweak"}
          </p>
          {plan.monthsLeft && <p className="mt-1 text-muted-foreground">{plan.monthsLeft} months to go</p>}
          <p className="mt-6 font-semibold">{pct}% of your debt paid</p>
          <div className="mt-2 flex gap-1.5" aria-label={`${pct}% paid`}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-3 flex-1 rounded-full ${i < filled ? "bg-green" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
        <div className="grid gap-5">
          <div className={card}>
            <p className="text-sm font-semibold text-muted-foreground">Interest still to pay</p>
            <p className="mt-1 font-heading text-3xl font-bold">{usd(plan.totalInterest)}</p>
          </div>
          <div className={card}>
            <p className="text-sm font-semibold text-muted-foreground">Days of work to pay interest</p>
            <p className="mt-1 font-heading text-3xl font-bold">{daysOfWork(plan.totalInterest, profile.income)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className={`${card} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your loans</h2>
            <Link to="/setup" className="text-sm font-semibold text-green-text">Edit</Link>
          </div>
          <ul className="mt-4 grid gap-4">
            {profile.loans.map((l) => {
              const p = l.startBalance > 0 ? Math.round(((l.startBalance - l.balance) / l.startBalance) * 100) : 0;
              const uw = plan.underwater.find((u) => u.id === l.id);
              return (
                <li key={l.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-muted-foreground">{usd(l.balance)} left</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-green" style={{ width: `${p}%` }} />
                  </div>
                  {uw && <p className="mt-2 text-sm text-tip">This payment doesn't cover the interest yet. Paying at least {usd(uw.minPayment)} a month will start shrinking it.</p>}
                </li>
              );
            })}
          </ul>
        </div>
        <Link to="/pay-faster" className="leaf group flex flex-col gap-3 bg-tip p-6 text-primary-foreground dark:text-foreground">
          <div className="flex items-center gap-3">
            <Sprout mood="thinking" size={56} />
            <p className="font-heading text-lg font-semibold">Sprout's tip</p>
          </div>
          <p>Even $25 extra a month on your highest-interest loan can bring your free day closer.</p>
          <span className="mt-auto flex items-center gap-1 font-semibold">See ways to pay faster <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </div>
    </div>
  );
}
