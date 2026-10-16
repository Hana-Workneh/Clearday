import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sprout } from "@/components/Sprout";
import { daysCloser } from "@/lib/debt";
import { loadProfile, saveProfile, percentPaid, planOptions, today } from "@/lib/store";

const OPEN = "clearday-open-payment";
/** Open the payment window from anywhere, optionally with a loan picked. */
export const openPayment = (loanId?: string) => window.dispatchEvent(new CustomEvent(OPEN, { detail: loanId }));

const field = "leaf w-full border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

export function PaymentFlow() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [party, setParty] = useState<{ days: number; pct: number } | null>(null);
  const loans = useMemo(() => (open ? loadProfile()?.loans.filter((l) => l.balance > 0) ?? [] : []), [open]);

  useEffect(() => {
    const h = (e: Event) => {
      const p = loadProfile();
      if (!p) { navigate({ to: "/setup" }); return; }
      const id = (e as CustomEvent<string | undefined>).detail;
      const loan = p.loans.find((l) => l.id === id && l.balance > 0) ?? p.loans.find((l) => l.balance > 0);
      if (!loan) return;
      setLoanId(loan.id);
      setAmount(String(Math.min(loan.payment, Math.ceil(loan.balance))));
      setDate(today());
      setOpen(true);
    };
    window.addEventListener(OPEN, h);
    return () => window.removeEventListener(OPEN, h);
  }, [navigate]);

  const pick = (id: string) => {
    setLoanId(id);
    const l = loans.find((x) => x.id === id);
    if (l) setAmount(String(Math.min(l.payment, Math.ceil(l.balance))));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const p = loadProfile();
    const amt = +amount;
    if (!p || !loanId || !(amt > 0)) return;
    const days = daysCloser(amt, p.loans, planOptions(p));
    const nextLoans = p.loans.map((l) => (l.id === loanId ? { ...l, balance: Math.max(0, Math.round((l.balance - amt) * 100) / 100) } : l));
    saveProfile({
      ...p,
      loans: nextLoans,
      payments: [...(p.payments ?? []), { id: crypto.randomUUID(), loanId, amount: amt, date }],
    });
    setOpen(false);
    setParty({ days, pct: percentPaid(nextLoans) });
    setTimeout(() => {
      setParty(null);
      navigate({ to: "/home" });
    }, 3800);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="leaf max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">I made a payment</DialogTitle>
            <DialogDescription>Nice one! Tell Sprout what you paid.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold">
              Which loan?
              <select className={field} value={loanId} onChange={(e) => pick(e.target.value)}>
                {loans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Amount (USD)
              <input className={field} type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Date
              <input className={field} type="date" required max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <button className="btn-main mt-2">Save payment</button>
          </form>
        </DialogContent>
      </Dialog>
      {party && <Celebration days={party.days} pct={party.pct} />}
    </>
  );
}

const colors = ["bg-green", "bg-tip", "bg-sun"];

function Celebration({ days, pct }: { days: number; pct: number }) {
  const bits = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      size: 6 + Math.random() * 8,
      color: colors[i % 3],
      round: i % 2 === 0,
    })),
    [],
  );
  return (
    <div role="status" className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background/95 px-6 text-center animate-in fade-in duration-300">
      {bits.map((b, i) => (
        <span key={i} aria-hidden className={`anim-confetti absolute top-0 ${b.color} ${b.round ? "rounded-full" : "rounded-sm"}`}
          style={{ left: `${b.left}%`, width: b.size, height: b.size * (b.round ? 1 : 1.6), animationDelay: `${b.delay}s`, transform: "translateY(-10vh)" }} />
      ))}
      <Sprout mood="cheering" size={150} />
      <h2 className="mt-6 text-3xl font-bold md:text-4xl">Nice! You're {days} {days === 1 ? "day" : "days"} closer to debt free.</h2>
      <p className="mt-4 font-heading text-6xl font-bold tracking-tight animate-in zoom-in-50 duration-700">{pct}%</p>
      <p className="mt-1 font-semibold text-muted-foreground">of your debt paid</p>
    </div>
  );
}
