import { money } from "@/lib/account-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lock, Leaf, Star, Plus } from "lucide-react";
import { openPayment } from "@/components/PaymentFlow";
import { Sprout } from "@/components/Sprout";
import { Button } from "@/components/ui/button";
import { simulate, formatMonth } from "@/lib/debt";
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

const card = "leaf-lg border bg-card p-6";
const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
const day = (s: string) => new Date(s + (s.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Progress() {
  const profile = useProfile();
  const usd = (n: number) => money(n, profile?.currency);
  const data = useMemo(() => {
    if (!profile) return null;
    const now = new Date();
    const plan = simulate(profile.loans, now, planOptions(profile));
    const payments = [...(profile.payments ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const leftNow = profile.loans.reduce((s, l) => s + l.balance, 0);
    // Past: from the starting total, step down with each logged payment, ending at today's balance.
    const paidLogged = payments.reduce((s, p) => s + p.amount, 0);
    let running = leftNow + paidLogged;
    const chart: { t: number; label: string; paid?: number; plan?: number }[] = [
      { t: new Date(profile.startedAt ?? today()).getTime(), label: short(new Date(profile.startedAt ?? today())), paid: Math.round(running) },
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
        <Link to="/setup" className="btn-main mt-6 inline-block">Get started</Link>
      </div>
    );
  }

  const { plan, payments, chart, badges, pct } = data;
  const loanName = (id: string) => profile.loans.find((l) => l.id === id)?.name ?? "Loan";
  const startDate = profile.startDebtFree ? new Date(profile.startDebtFree) : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <div className="flex items-center gap-4">
        <Sprout mood={profile.loans.every((loan) => loan.balance <= 0) ? "crowned" : "cheering"} size={70} />
        <div>
          <h1 className="page-title">Look how far you've come</h1>
          <p className="page-sub mt-1">{pct}% of your debt paid. Every payment counts!</p>
        </div>
      </div>

      <div className={`${card} grid gap-3 md:grid-cols-2`}>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">When you started</p>
          <p className="font-heading text-2xl font-bold">Debt free by {startDate ? formatMonth(startDate) : "—"}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Now</p>
          <p className="font-heading text-2xl font-bold">Debt free by {plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "—"}</p>
        </div>
      </div>

      {profile.demo && <Button asChild variant="outline" className="btn-secondary w-fit max-w-full whitespace-normal"><Link to="/debt-free" search={{preview: true}}>Preview the debt free moment</Link></Button>}

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
              <YAxis tickFormatter={(v) => usd(v)} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--border)" width={78} />
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
          {badges.map((b, i) => { const next = !b.got && i === badges.findIndex(x => !x.got); return (
            <div key={b.name} className={`leaf flex items-center gap-3 border p-4 ${b.got ? "badge-win border-sun bg-chip-yellow text-chip-yellow-text ring-1 ring-sun" : next ? "border-2 border-sun bg-card" : "bg-secondary opacity-60 grayscale"}`}>
              <span className={`leaf flex h-10 w-10 shrink-0 items-center justify-center ${b.got ? "bg-sun text-ink" : next ? "bg-chip-yellow text-chip-yellow-text" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                {b.got ? <Leaf className="h-5 w-5" /> : next ? <Star className="h-4 w-4 fill-sun text-sun" /> : <Lock className="h-4 w-4" />}
              </span>
              <span className="min-w-0">{next && <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Next up</span>}<span className={`font-semibold ${b.got || next ? "" : "text-muted-foreground"}`}>{b.name}</span></span>
            </div>
          ); })}
        </div>
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
