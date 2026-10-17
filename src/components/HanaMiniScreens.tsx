import { Sprout } from "./Sprout";
import { createDemoPersona } from "@/lib/demo-personas";
import { daysCloser, formatMonth, simulate, usd } from "@/lib/debt";
import { Star, Sparkles } from "lucide-react";

// A display-only snapshot: never reads browser/account data or saves payments.
const snapshotDate = new Date(2026, 9, 17);
const hana = createDemoPersona("hana", snapshotDate);
const current = simulate(hana.loans, snapshotDate, hana.plan);
const faster = simulate(hana.loans, snapshotDate, { ...hana.plan, extra: 75 });
const initialDebt = hana.loans.reduce((sum, loan) => sum + loan.startBalance, 0);
const remaining = hana.loans.reduce((sum, loan) => sum + loan.balance, 0);
const paid = Math.round((1 - remaining / initialDebt) * 100);
const lastPayment = hana.payments?.at(-1);
const sooner = Math.max(0, (current.monthsLeft ?? 0) - (faster.monthsLeft ?? 0));

function Pills() {
  return <div className="mt-4 grid grid-cols-10 gap-1" aria-label={`${paid}% paid`}>
    {Array.from({ length: 10 }, (_, i) => <span key={i} className={`h-2.5 rounded-full ${i < Math.floor(paid / 10) ? "bg-green" : "bg-track"}`} />)}
  </div>;
}

export function HanaMiniScreen({ screen }: { screen: "home" | "celebrate" | "pay" }) {
  return <div className="hana-mini-screen pointer-events-none select-none" role="img" aria-label={`Hana’s ${screen === "celebrate" ? "payment celebration" : screen === "pay" ? "Pay faster" : "Home"} demo preview`}>
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b pb-3">
      <span className="font-heading text-sm font-semibold">clearday</span>
      <span className="text-[10px] font-bold text-muted-foreground">HANA · DEMO</span>
    </div>
    {screen === "home" && <>
      <p className="text-xs text-muted-foreground">A little closer, Hana.</p>
      <h3 className="mt-1 font-heading text-xl font-semibold">Home</h3>
      <div className="mt-4 relative">
        <p className="text-xs font-semibold text-muted-foreground">Debt free by</p>
        <p className="mt-2 font-heading text-[28px] font-bold leading-tight">{current.debtFreeDate ? formatMonth(current.debtFreeDate) : "Your free day"}</p>
        <Pills />
        <p className="mt-2 text-xs font-semibold">{paid}% of the way there</p>
        <span className="chip-yellow mt-3 inline-flex items-center gap-1 text-[10px]"><Star className="size-3" /> First loan paid off</span>
      </div>
      <div className="mt-5 border-t pt-3">
        <p className="text-xs font-semibold">Your loans · {usd(remaining)} left</p>
        {hana.loans.slice(0, 2).map(loan => <div key={loan.id} className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[11px]"><span>{loan.name}</span><span className="font-semibold">{usd(loan.balance)}</span></div>)}
      </div>
    </>}
    {screen === "celebrate" && <div className="relative text-center">
      <div className="mini-confetti" aria-hidden="true">{Array.from({length: 16}, (_, i) => <i key={i} className={`mini-confetti-${i % 3}`} />)}</div>
      <div className="relative mx-auto w-fit"><Sprout mood="cheering" size={130} /></div>
      <span className="chip-yellow mt-2 inline-flex items-center gap-1"><Sparkles className="size-3" />{daysCloser(lastPayment?.amount ?? 0, hana.loans, hana.plan)} days closer</span>
      <h3 className="mt-4 font-heading text-xl font-semibold">You did it, Hana!</h3>
      <p className="mt-2 text-xs text-muted-foreground">{usd(lastPayment?.amount ?? 0)} paid. A little more freedom.</p>
      <Pills />
      <p className="mt-2 text-xs font-semibold">{paid}% of the way there</p>
    </div>}
    {screen === "pay" && <>
      <h3 className="font-heading text-xl font-semibold">Pay faster</h3>
      <p className="mt-4 text-xs font-semibold">Extra each month</p>
      <p className="mt-1 font-heading text-3xl font-bold">$75</p>
      <div className="relative my-5 h-2 rounded-full bg-track"><span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-green" /><span className="absolute left-1/3 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-green bg-card" /></div>
      <p className="text-xs text-muted-foreground">With a little extra, debt free by</p>
      <p className="mt-2 font-heading text-[28px] font-bold leading-tight">{faster.debtFreeDate ? formatMonth(faster.debtFreeDate) : "Your free day"}</p>
      <div className="mt-4 flex flex-wrap gap-2"><span className="chip-green text-[10px]">{sooner} months sooner</span><span className="chip-purple text-[10px]">Save {usd(current.totalInterest - faster.totalInterest)}</span></div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t pt-3"><p className="text-xs text-muted-foreground">Small steps. A closer date.</p><Sprout mood="waving" size={55} /></div>
    </>}
  </div>;
}