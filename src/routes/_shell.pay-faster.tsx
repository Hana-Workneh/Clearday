import { money } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sprout } from "@/components/Sprout";
import { Slider } from "@/components/ui/slider";
import { simulate, formatMonth, type PlanResult, type Strategy } from "@/lib/debt";
import { saveProfile, useProfile, planOptions } from "@/lib/store";
import { markStartStep } from "@/lib/start-here";

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

const months = (n: number) => `${n} ${n === 1 ? "month" : "months"}`;
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
  const base = useMemo(() => simulate(loans, now), [loans, now]);
  const next = useMemo(() => simulate(loans, now, { ...(profile ? planOptions(profile, now) : {}), extra, strategy }), [profile, loans, now, extra, strategy]);
  const byStrategy = useMemo(
    () => Object.fromEntries(options.map((o) => [o.key, simulate(loans, now, { extra, strategy: o.key })])) as Record<Strategy, PlanResult>,
    [loans, now, extra],
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

  const sooner = base.monthsLeft != null && next.monthsLeft != null ? base.monthsLeft - next.monthsLeft : 0;
  const saving = Math.max(0, Math.round(base.totalInterest - next.totalInterest));
  const better = sooner > 0 || saving > 1;
  const nowMonths = base.monthsLeft ?? 600;
  const newWidth = Math.max(4, Math.round(((next.monthsLeft ?? 600) / nowMonths) * 100));
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
        <p className="page-sub mt-1">Small changes can bring your free day much closer.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left: extra money */}
        <section className="leaf-lg border bg-card p-6 md:p-8 lg:col-span-3">
          <div className="flex items-end justify-between">
            <p className="font-semibold text-muted-foreground">Extra each month</p>
            <p className="font-heading text-4xl font-bold tracking-tight">{usd(extra)}</p>
          </div>
          <Slider className="mt-6" min={0} max={Math.max(300, suggested ?? 0, profile.plan?.extra ?? 0)} step={5} value={[extra]} onValueChange={(v) => setExtra(v[0] ?? 0)} aria-label="Extra money each month" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{usd(0)}</span><span>{usd(Math.max(300, suggested ?? 0, profile.plan?.extra ?? 0))}</span></div>

          <div className="leaf mt-6 bg-background p-6">
            <p className="text-sm font-semibold text-muted-foreground">New debt free date</p>
            <p key={label} className={`big-date mt-2 ${better ? "animate-in zoom-in-95 fade-in duration-500" : ""}`}>{label}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sooner > 0 && <span className="chip-green">{months(sooner)} sooner</span>}
              {saving > 0 && <span className="chip-purple">{usd(saving)} less interest</span>}
              {!better && <span className="text-sm text-muted-foreground">Slide to see what a little extra could do.</span>}
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm">
            <div>
              <div className="mb-1.5 flex justify-between"><span className="font-semibold">Now</span><span className="text-muted-foreground">{base.debtFreeDate ? formatMonth(base.debtFreeDate) : "—"}</span></div>
              <div className="h-3 w-full rounded-full bg-bar" />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between"><span className="font-semibold">With {usd(extra)} extra</span><span className="text-muted-foreground">{label}</span></div>
              <div className="h-3 rounded-full bg-green transition-all duration-500" style={{ width: `${Math.min(100, newWidth)}%` }} />
            </div>
          </div>
        </section>

        {/* Right: order */}
        <section className="flex flex-col gap-4 lg:col-span-2">
          <div className="leaf-lg border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Which loan should you pay first?</h2>
            <div className="mt-4 grid gap-3">
              {options.map((o) => {
                const p = byStrategy[o.key];
                const on = strategy === o.key;
                return (
                  <button key={o.key} onClick={() => setStrategy(o.key)} aria-pressed={on} disabled={loans.length < 2 && o.key !== "avalanche"}
                    className={`leaf p-4 text-left transition disabled:opacity-40 ${on ? "border-2 border-foreground" : "border-2 border-transparent bg-background hover:border-line-strong"}`}>
                    <p className="font-semibold">{o.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{o.text}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {p.debtFreeDate ? formatMonth(p.debtFreeDate) : "Not yet"} · {usd(p.totalInterest)} interest
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-end gap-3">
            <Sprout key={better ? `j${next.monthsLeft}` : "t"} mood={saved || better ? "cheering" : "thinking"} size={64} />
            <p className="leaf flex-1 bg-chip-purple p-4 text-sm text-chip-purple-text">
              {saved ? "Saved! Your new date is on Home." : tip}
            </p>
          </div>

          {error && <p role="alert" className="text-sm text-tip">{error}</p>}
          <button onClick={use} disabled={saved || isSaving} className="btn-main w-full">{isSaving ? "Saving…" : "Make this my plan"}</button>
        </section>
      </div>
    </div>
  );
}
