import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { Slider } from "@/components/ui/slider";
import { simulate, formatMonth, usd, type PlanResult, type Strategy } from "@/lib/debt";
import { saveProfile, useProfile } from "@/lib/store";

export const Route = createFileRoute("/_shell/pay-faster")({
  head: () => ({
    meta: [
      { title: "Pay faster · Clearday" },
      { name: "description", content: "Try paying a little more or a different loan order and see your free day move closer." },
      { property: "og:title", content: "Pay faster · Clearday" },
      { property: "og:description", content: "Try paying a little more or a different loan order and see your free day move closer." },
    ],
  }),
  component: PayFaster,
});

const card = "leaf-lg flex flex-col border bg-card p-6";
const months = (n: number) => `${n} ${n === 1 ? "month" : "months"}`;

function PayFaster() {
  const profile = useProfile();
  const navigate = useNavigate();
  const [extra, setExtra] = useState(0);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.plan) {
      setExtra(profile.plan.extra ?? 0);
      setStrategy(profile.plan.strategy ?? "avalanche");
    }
  }, [profile]);

  const loans = profile?.loans ?? [];
  const now = useMemo(() => new Date(), []);
  const base = useMemo(() => simulate(loans, now), [loans, now]);
  const withExtra = useMemo(() => simulate(loans, now, { extra, strategy }), [loans, now, extra, strategy]);
  const avalanche = useMemo(() => simulate(loans, now, { extra, strategy: "avalanche" }), [loans, now, extra]);
  const snowball = useMemo(() => simulate(loans, now, { extra, strategy: "snowball" }), [loans, now, extra]);

  if (profile === undefined) return null;
  if (!profile) {
    return (
      <div className={`${card} mx-auto max-w-xl items-center text-center`}>
        <Sprout mood="thinking" size={100} />
        <h1 className="mt-4 text-2xl font-semibold">Add your loans first</h1>
        <p className="mt-2 text-muted-foreground">Then we can find ways to reach your free day sooner.</p>
        <Link to="/setup" className="btn-main mt-6">Get started</Link>
      </div>
    );
  }

  const sooner = diffMonths(base, withExtra);
  const saving = Math.max(0, base.totalInterest - withExtra.totalInterest);
  const better = sooner > 0 || saving > 1;

  const use = () => {
    saveProfile({ ...profile, plan: { extra, strategy } });
    setSaved(true);
    setTimeout(() => navigate({ to: "/home" }), 1600);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex items-center gap-4">
        <Sprout key={better ? `j${withExtra.monthsLeft}` : "c"} mood={better ? "cheering" : "thinking"} size={72} />
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">Pay faster</h1>
          <p className="text-muted-foreground">Small changes can bring your free day much closer.</p>
        </div>
      </div>

      <div className={`grid gap-5 ${loans.length >= 2 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
        {/* 1. Current */}
        <div className={card}>
          <p className="text-sm font-semibold text-muted-foreground">1 · Your current plan</p>
          <Stats plan={base} base={base} />
          <p className="mt-4 text-sm text-muted-foreground">Your monthly payments as they are today.</p>
        </div>

        {/* 2. Extra */}
        <div className={card}>
          <p className="text-sm font-semibold text-muted-foreground">2 · Pay a little more</p>
          <Stats plan={withExtra} base={base} />
          <div className="mt-6">
            <div className="flex justify-between text-sm font-semibold">
              <span>Extra each month</span>
              <span className="text-green-text">{usd(extra)}</span>
            </div>
            <Slider className="mt-3" min={0} max={300} step={5} value={[extra]} onValueChange={(v) => setExtra(v[0] ?? 0)} aria-label="Extra money each month" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>$0</span><span>$300</span></div>
          </div>
          <p className="leaf mt-4 bg-secondary p-3 text-sm">
            {extra === 0
              ? "Slide to see what a little extra could do."
              : better
                ? `You'd be debt free ${sooner > 0 ? `${months(sooner)} sooner` : "on the same month"} and save ${usd(saving)}.`
                : "Every dollar helps. Try a bit more to see the date move!"}
          </p>
        </div>

        {/* 3. Order */}
        {loans.length >= 2 && (
          <div className={card}>
            <p className="text-sm font-semibold text-muted-foreground">3 · Which loan first</p>
            <div className="mt-4 grid gap-3">
              {([
                ["avalanche", "Biggest interest first", "(saves the most)", "Extra money goes to the loan that costs you the most each month.", avalanche],
                ["snowball", "Smallest loan first", "(quick wins)", "Clear small loans fast so you feel the progress sooner.", snowball],
              ] as const).map(([key, title, tag, text, plan]) => (
                <button key={key} onClick={() => setStrategy(key)} aria-pressed={strategy === key}
                  className={`leaf border p-4 text-left transition ${strategy === key ? "border-green bg-green/10" : "bg-card hover:bg-secondary"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{title} <span className="font-normal text-muted-foreground">{tag}</span></p>
                    {strategy === key && <Check className="h-5 w-5 shrink-0 text-green-text" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  <p className="mt-2 text-sm">
                    {plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "Not yet"} · {usd(plan.totalInterest)} interest
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="leaf-lg flex flex-col items-center justify-between gap-4 border bg-card p-6 sm:flex-row">
        <div className="flex items-center gap-3">
          {saved && <Sprout mood="cheering" size={56} />}
          <p className="font-semibold">
            {saved ? "Saved! Your new date is on Home 🎉" : `Your pick: ${usd(extra)} extra a month, ${strategy === "avalanche" ? "biggest interest first" : "smallest loan first"}.`}
          </p>
        </div>
        <button onClick={use} disabled={saved} className="btn-main">
          Use this plan
        </button>
      </div>
    </div>
  );
}

function diffMonths(base: PlanResult, p: PlanResult) {
  if (base.monthsLeft == null || p.monthsLeft == null) return 0;
  return base.monthsLeft - p.monthsLeft;
}

function Stats({ plan, base }: { plan: PlanResult; base: PlanResult }) {
  const saved = Math.max(0, base.totalInterest - plan.totalInterest);
  const closer = diffMonths(base, plan) > 0;
  const label = plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : "Not yet";
  return (
    <div className="mt-3">
      <p key={label} className={`font-heading text-3xl font-bold text-green-text ${closer ? "animate-in zoom-in-90 fade-in duration-500" : ""}`}>{label}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-muted-foreground">Total interest</dt><dd className="font-semibold">{usd(plan.totalInterest)}</dd></div>
        <div><dt className="text-muted-foreground">Money saved</dt><dd className="font-semibold">{usd(saved)}</dd></div>
      </dl>
    </div>
  );
}
