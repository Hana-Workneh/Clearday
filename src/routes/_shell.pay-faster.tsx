import { money } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sprout } from "@/components/Sprout";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { simulate, formatMonth, type PlanResult, type Strategy } from "@/lib/debt";
import { saveProfile, useProfile, planOptions } from "@/lib/store";
import { markStartStep } from "@/lib/start-here";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { canCompareOrder, comparePayoff, equivalentOrders } from "@/lib/pay-faster";

export const Route = createFileRoute("/_shell/pay-faster")({
  validateSearch: (search: Record<string, unknown>): { extra?: number } => {
    const extra = Number(search['extra']);
    return Number.isFinite(extra) && extra >= 0 && extra <= 1000000 ? { extra } : {};
  },
  head: () => ({
    meta: [
      { title: "Pay faster · Clearday" },
      { name: "description", content: "Try paying a little more or a different loan order and see your free day move closer." },
      { property: "og:title", content: "Pay faster · Clearday" },
      { property: "og:description", content: "Try paying a little more or a different loan order and see your free day move closer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PayFaster,
});

const options: { key: Strategy; title: string; text: string }[] = [
  { key: "avalanche", title: "Most expensive loan first", text: "Saves the most money." },
  { key: "snowball", title: "Smallest loan first", text: "Clear one loan fast and feel the win." },
  { key: "order", title: "Keep my current order", text: "Pay loans in the order you added them." },
];

function PayFaster() {
  const profile = useProfile();
  useEffect(() => { markStartStep("payFaster"); }, []);
  const usd = (n: number) => money(n, profile?.currency);
  const suggested = Route.useSearch().extra;
  const navigate = useNavigate();
  const [extra, setExtra] = useState(0);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [saved, setSaved] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setExtra(suggested ?? profile.plan?.extra ?? 0);
      setStrategy(profile.plan?.strategy ?? "avalanche");
    }
  }, [profile, suggested]);

  const loans = profile?.loans ?? [];
  const now = useMemo(() => new Date(), []);
  const baseOptions = useMemo(() => ({ ...(profile ? planOptions(profile, now) : {}), extra: 0 }), [profile, now]);
  const nextOptions = useMemo(() => ({ ...baseOptions, extra, strategy }), [baseOptions, extra, strategy]);
  const base = useMemo(() => simulate(loans, now, baseOptions), [loans, now, baseOptions]);
  const next = useMemo(() => simulate(loans, now, nextOptions), [loans, now, nextOptions]);
  const byStrategy = useMemo(
    () => Object.fromEntries(options.map((o) => [o.key, simulate(loans, now, { ...nextOptions, strategy: o.key })])) as Record<Strategy, PlanResult>,
    [loans, now, nextOptions],
  );

  if (profile === undefined) return null;
  if (!profile) {
    return (
      <div className="leaf-lg mx-auto flex max-w-xl flex-col items-center border bg-card p-8 text-center">
        <Sprout mood="thinking" size={100} />
        <h1 className="page-title mt-4">Add your loans first</h1>
        <p className="page-sub mt-1">Then we can find ways to reach your free day sooner.</p>
        <Link to="/setup" className="btn-main mt-6">Get started</Link>
      </div>
    );
  }

  const comparison = comparePayoff(base, next, loans, baseOptions, nextOptions);
  const saving = Math.max(0, comparison.saving);
  const better = comparison.difference > 0 || saving > 0;
  const interestText = Math.abs(comparison.saving) > 0 && Math.abs(comparison.saving) < 1
    ? "less than " + usd(1) : usd(Math.abs(comparison.saving));
  const resultText = next.monthsLeft === null
    ? "This payment doesn't yet clear your loans. Try a little more if you can."
    : base.monthsLeft === null
      ? "Your extra payment gives you a debt free date."
      : `${comparison.time} and ${interestText} ${comparison.saving >= 0 ? "less" : "more"} interest.`;
  const almostPaid = extra > 0 && (base.monthsLeft ?? 600) <= 1 && comparison.days < 2 && saving < 1;
  const daysBack = profile.income > 0 ? saving / (profile.income / 22) : 0;
  const daysBackText = daysBack >= 1 ? `${Math.round(daysBack)} work ${Math.round(daysBack) === 1 ? "day" : "days"} back` : `${Math.round(daysBack * 10) / 10} work days back`;
  const label = next.debtFreeDate ? formatMonth(next.debtFreeDate) : "Not yet";

  const use = async () => {
    setSaving(true); setError("");
    try { await saveProfile({ ...profile, plan: { extra, strategy } }); }
    catch { setError("Your plan couldn't save. Please try again."); setSaving(false); return; }
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate({ to: "/home" }), 1600);
  };

  const tip =
    strategy === "avalanche"
      ? "Paying the most expensive loan first means less of your money goes to interest."
      : strategy === "snowball"
        ? "Clearing a small loan first gives you a quick win, and its payment then helps the next one."
        : "Your loans get paid in the order you added them. Try the other options to compare.";

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div>
        <h1 className="page-title">Pay faster</h1>
        <p className="page-sub mt-2 max-w-3xl">Paying a little extra each month gets you to your debt free day sooner and costs you less interest. Move the slider to see how much.</p>
        <Dialog>
          <DialogTrigger asChild><Button variant="link" className="mt-2 h-auto px-0 text-green-text">How this works</Button></DialogTrigger>
          <DialogContent className="leaf-lg w-[calc(100%-40px)] bg-card">
            <DialogTitle className="font-heading">How this works</DialogTitle>
            <div className="flex items-start gap-4">
              <Sprout mood="waving" size={64} />
              <DialogDescription className="grid gap-3">
                <span>We add monthly interest, then subtract your payments and any extra.</span>
                <span>When a loan is paid off, its payment helps the next loan in your chosen order.</span>
                <span>Dates use monthly payments; weeks and days estimate the final part-payment. Your lender’s timing may differ.</span>
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left: extra money */}
        <section className="leaf-lg border bg-card p-6 md:p-8 lg:col-span-3">
          <div className="flex items-end justify-between">
            <p className="font-semibold text-muted-foreground">Extra each month</p>
            <div className="flex flex-wrap items-center justify-end gap-3"><p className="font-heading text-4xl font-bold tracking-tight">{usd(extra)}</p><Input aria-label="Exact extra each month" type="number" min={0} max={Math.max(300, suggested ?? 0, profile.plan?.extra ?? 0)} step="0.01" value={extra} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setExtra(Math.max(0, Math.min(Math.max(300, suggested ?? 0, profile.plan?.extra ?? 0), value))); }} className="w-24 bg-background" /></div>
          </div>
          <Slider className="mt-6" min={0} max={Math.max(300, suggested ?? 0, profile.plan?.extra ?? 0)} step={5} value={[extra]} onValueChange={(v) => setExtra(v[0] ?? 0)} aria-label="Extra money each month" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{usd(0)}</span><span>{usd(Math.max(300, suggested ?? 0, profile.plan?.extra ?? 0))}</span></div>

          <div className="leaf mt-6 bg-background p-6">
            <p className="text-sm font-semibold text-muted-foreground">New debt free date</p>
            <p key={label} className={`big-date mt-2 ${better ? "animate-in zoom-in-95 fade-in duration-500" : ""}`}>{label}</p>
            <p role="status" className="mt-4 text-sm font-semibold leading-relaxed">{resultText}</p>
            {almostPaid && <p className="mt-2 text-sm text-muted-foreground">Your loans are almost paid off, so extra money only helps a little. Nice work!</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {daysBack >= 0.1 && <span className="chip-yellow">You get {daysBackText}</span>}
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm">
            <div>
              <div className="mb-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1"><span className="font-semibold">Now · no extra</span><span className="text-muted-foreground">{base.debtFreeDate ? formatMonth(base.debtFreeDate) : "Not yet"} · Starting point</span></div>
              <div className="h-3 w-full rounded-full bg-background"><div data-testid="base-bar" className="h-3 rounded-full bg-bar" style={{ width: `${comparison.baseWidth ?? 100}%` }} /></div>
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1"><span className="font-semibold">With {usd(extra)} extra</span><span className="text-muted-foreground">{label} · {base.monthsLeft !== null && next.monthsLeft !== null ? comparison.time : "Timing not comparable yet"}</span></div>
              <div className="h-3 w-full rounded-full bg-background"><div data-testid="extra-bar" className="h-3 rounded-full bg-green transition-all duration-500 motion-reduce:transition-none" style={{ width: `${comparison.nextWidth ?? 100}%` }} /></div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Weeks, days and bar lengths estimate the final part-payment. Dates follow the monthly schedule.{(base.monthsLeft === null || next.monthsLeft === null) && " A full bar marked ‘Not yet’ has no calculated end date."}</p>
          </div>
        </section>

        {/* Right: order */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          {canCompareOrder(loans) ? <div className="leaf-lg border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Which loan should you pay first?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your extra money goes to one loan at a time. When that loan is paid off, its payment moves to the next one.</p>
            {equivalentOrders(Object.values(byStrategy)) && <p className="mt-2 text-sm text-muted-foreground">With your loans, the order doesn't change much.</p>}
            <div className="mt-4 grid gap-3">
              {options.map((o) => {
                const p = byStrategy[o.key];
                const on = strategy === o.key;
                return (
                  <Button variant="ghost" key={o.key} onClick={() => setStrategy(o.key)} aria-pressed={on}
                    className={`leaf block h-auto whitespace-normal p-4 text-left transition ${on ? "border-2 border-foreground" : "border-2 border-transparent bg-background hover:border-line-strong"}`}>
                    <p className="font-semibold">{o.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{o.text}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {p.debtFreeDate ? formatMonth(p.debtFreeDate) : "Not yet"} · {usd(p.totalInterest)} interest
                    </p>
                  </Button>
                );
              })}
            </div>
          </div> : <p className="leaf border bg-card p-6 text-sm text-muted-foreground">Add another loan to compare which one to pay first.</p>}

          <div className="flex items-end gap-3">
            <Sprout key={better ? `j${next.monthsLeft}` : "t"} mood={saved || better ? "cheering" : "thinking"} size={64} />
            <p className="leaf flex-1 bg-chip-purple p-4 text-sm text-chip-purple-text">
              {saved ? "Saved! Your new date is on Home." : canCompareOrder(loans) ? tip : "Every extra payment goes to your remaining loan. Choose an amount that feels comfortable."}
            </p>
          </div>

          {error && <p role="alert" className="text-sm text-tip">{error}</p>}
          <Button onClick={use} disabled={saved || isSaving} className="btn-main w-full">{isSaving ? "Saving…" : "Save to my plan"}</Button>
          <p className="text-center text-xs text-muted-foreground">This only updates your plan in Clearday. No money moves.</p>
        </section>
      </div>
    </div>
  );
}
