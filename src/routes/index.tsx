import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { beginSetup } from "@/lib/app-access";
import { startDemo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { WelcomeSections } from "@/components/WelcomeSections";
import { WelcomeNav } from "@/components/WelcomeNav";
import { TryItCalculator } from "@/components/TryItCalculator";
import { useMemo, useState } from "react";
import { simulate } from "@/lib/debt";
import { ArrowRight, Check, LockKeyhole, Play, Sprout, Timer } from "lucide-react";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { start?: boolean | undefined } => ({ start: s["start"] === true || s["start"] === "true" ? true : undefined }),
  head: () => ({
    meta: [
      { title: "Clearday — See the day you'll be free" },
      {
        name: "description",
        content: "Add your loans and see the exact month you'll be debt free.",
      },
      { property: "og:title", content: "Clearday — See the day you'll be free" },
      {
        property: "og:description",
        content: "Add your loans and see the exact month you'll be debt free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const { start } = Route.useSearch();
  const [owe, setOwe] = useState(4000);
  const [pay, setPay] = useState(155);
  const result = useMemo(() => simulate([
    { id: "try", name: "Loan", balance: owe, startBalance: owe, rate: 15, payment: pay },
  ]), [owe, pay]);
  return (
    <div className="min-h-screen" id="top">
      <WelcomeNav />
      {start && <div role="status" className="page-wrap relative pt-24 text-center text-sm font-semibold text-muted-foreground">Start your plan or try the demo</div>}
      <section className="welcome-hero page-wrap relative">
        <div className="welcome-hero-grid">
          <div className="welcome-hero-copy min-w-0">
            <p className="welcome-hero-pill inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold text-green-text"><Sprout className="size-4 shrink-0" />See the day you'll be free</p>
            <h1 className="welcome-hero-title font-semibold leading-tight">
              <span className="block">Debt feels <span className="hero-endless text-muted-foreground">endless<svg viewBox="0 0 200 24" aria-hidden="true"><path d="M4 15 Q40 5 76 13 T145 11 T196 9" pathLength="1" /></svg></span>.</span>
              <span className="block">It doesn't have to.</span>
            </h1>
            <p className="welcome-hero-subtitle text-balance text-lg text-muted-foreground">
              Add your loans and see the <strong className="font-bold text-foreground">exact month</strong> you'll be debt free. Then watch it get closer with every payment.
            </p>
            <div className="welcome-hero-buttons flex gap-3">
              <Button asChild className="btn-main">
                <Link to="/setup" onClick={beginSetup}>Find my debt free date<ArrowRight className="size-4" /></Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  startDemo();
                  navigate({ to: "/home" });
                }}
                className="btn-secondary"
              >
                <Play className="size-3.5 fill-current" />Try the demo
              </Button>
            </div>
            <div className="welcome-hero-trust flex flex-wrap gap-2">
              {[{ Icon: Check, label: "Free" }, { Icon: LockKeyhole, label: "No bank connection" }, { Icon: Timer, label: "2 minutes" }].map(({ Icon, label }) => <span key={label} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-2 text-[11px] font-semibold"><Icon className="size-3.5 text-muted-foreground" />{label}</span>)}
            </div>
            <p className="welcome-hero-fact flex max-w-sm items-center gap-3 text-left text-xs leading-relaxed text-muted-foreground"><span className="shrink-0 font-heading text-[40px] font-bold leading-none text-stat-purple">65%</span><span>of US millennials with debt don't know when it will end.<span className="block text-[10px]">CreditCards.com, 2017</span></span></p>
          </div>
          <div className="welcome-hero-panel min-w-0">
            <TryItCalculator owe={owe} pay={pay} result={result} onOweChange={setOwe} onPayChange={setPay} />
          </div>
        </div>
      </section>
      <WelcomeSections />
    </div>
  );
}
