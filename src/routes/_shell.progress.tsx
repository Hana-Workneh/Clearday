import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lock, Leaf } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { simulate, formatMonth, usd } from "@/lib/debt";
import { useProfile, planOptions, percentPaid, today } from "@/lib/store";

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

const card = "leaf border bg-card p-6";
const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
const day = (s: string) => new Date(s + (s.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Progress() {
  const profile = useProfile();
  const data = useMemo(() => {
    if (!profile) return null;
    const now = new Date();
    const plan = simulate(profile.loans, now, planOptions(profile));
    const payments = [...(profile.payments ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const startTotal = profile.loans.reduce((s, l) => s + l.startBalance, 0);
    const leftNow = profile.loans.reduce((s, l) => s + l.balance, 0);
    // Past: from the starting total, step down with each logged payment, ending at today's balance.
    const paidLogged = payments.reduce((s, p) => s + p.amount, 0);
    let running = leftNow + paidLogged;
    const chart: { t: number; label: string; paid?: number; plan?: number }[] = [
      { t: new Date(profile.startedAt ?? today()).getTime(), label: short(new Date(profile.startedAt ?? today())), paid: Math.max(running, Math.min(startTotal, running)) },
    ];
    for (const p of payments) {
      running -= p.amount;
      const d = new Date(p.date + "T12:00:00");
      chart.push({ t: d.getTime(), label: short(d), paid: Math.max(0, Math.round(running)) });
    }
    chart.push({ t: now.getTime(), label: short(now), paid: Math.round(leftNow), plan: Math.round(leftNow) });
    const step = Math.max(1, Math.ceil(plan.schedule.length / 24));
    plan.schedule.forEach((m, i) => {
      if (i % step === 0 || i === plan.schedule.length - 1) chart.push({ t: m.date.getTime(), label: short(m.date), plan: Math.round(m.totalLeft) });
    });

    const pct = percentPaid(profile.loans);
    const badges = [
      { name: "First payment", got: payments.length > 0 },
      { name: "10% paid", got: pct >= 10 },
      { name: "25% paid", got: pct >= 25 },
      { name: "Halfway there", got: pct >= 50 },
      { name: "First loan paid off", got: profile.loans.some((l) => l.balance <= 0) },
      { name: "Debt free", got: leftNow <= 0 },
    ];
    return { plan, payments: payments.reverse(), chart, badges, pct };
  }, [profile]);

  if (profile === undefined) return null;
  if (!profile || !data) {
    return (
      <div className={`${card} mx-auto max-w-xl text-center`}>
        <div className="flex justify-center"><Sprout mood="waving" size={110} /></div>
        <h1 className="mt-4 text-2xl font-semibold">Your progress will show up here.</h1>
        <Link to="/setup" className="leaf mt-6 inline-block bg-primary px-7 py-3.5 font-semibold text-primary-foreground">Get started</Link>
      </div>
    );
  }

  const { plan, payments, chart, badges, pct } = data;
  const loanName = (id: string) => profile.loans.find((l) => l.id === id)?.name ?? "Loan";
  const startDate = profile.startDebtFree ? new Date(profile.startDebtFree) : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <div className="flex items-center gap-4">
        <Sprout mood="cheering" size={70} />
        <div>
          <h1 className="text-3xl font-semibold">Look how far you've come</h1>
          <p className="text-muted-foreground">{pct}% of your debt paid. Every payment counts!</p>
        </div>
      </div>

      <div className={`${card} grid gap-3 md:grid-cols-2`}>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">When you started</p>
          <p className="font-heading text-2xl font-bold">Debt free by {startDate ? formatMonth(startDate) : "—"}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Now</p>
          <p className="font-heading text-2xl font-bold text-green-text">Debt free by {plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "—"}</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-xl font-semibold">Total debt over time</h2>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-green" /> Paid so far</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-tip" /> Your plan ahead</span>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => short(new Date(t))} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)" />
              <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)" width={44} />
              <Tooltip
                labelFormatter={(t) => short(new Date(t as number))}
                formatter={(v: number, k) => [usd(v), k === "paid" ? "Debt left" : "Plan"]}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px" }}
              />
              <Area type="monotone" dataKey="paid" stroke="var(--green)" fill="var(--green)" fillOpacity={0.2} strokeWidth={3} connectNulls />
              <Area type="monotone" dataKey="plan" stroke="var(--tip)" fill="var(--tip)" fillOpacity={0.08} strokeWidth={2} strokeDasharray="6 4" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((b) => (
            <div key={b.name} className={`leaf flex items-center gap-3 border p-4 ${b.got ? "bg-sun/25" : "bg-secondary opacity-60 grayscale"}`}>
              <span className={`leaf flex h-10 w-10 shrink-0 items-center justify-center ${b.got ? "bg-green text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                {b.got ? <Leaf className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </span>
              <span className={`font-semibold ${b.got ? "" : "text-muted-foreground"}`}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h2 className="text-xl font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No payments yet. Tap "I made a payment" when you pay one.</p>
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
