import { money, type Currency } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { simulate, formatMonth, daysOfWork, type Loan } from "@/lib/debt";
import { loadProfile, saveProfile, useProfile } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { emptyLoan, loanErrors, draftIsEmpty, canContinueLoans, commitLoan, type LoanDraft } from "@/lib/loan-entry";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set up · Clearday" },
      { name: "description", content: "Add your income and loans to see the month you'll be debt free." },
      { property: "og:title", content: "Set up · Clearday" },
      { property: "og:description", content: "Add your income and loans to see the month you'll be debt free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Setup,
});

const steps = ["Your income", "Your loans", "Your date"];
const field = "leaf w-full border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";
const label = "mb-1.5 block text-sm font-semibold";
const mainBtn = "btn-main";

function Setup() {
  const navigate = useNavigate();
  const profile = useProfile();
  const currency = profile?.currency ?? "USD";
  const usd = (n: number) => money(n, currency);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [job, setJob] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [draft, setDraft] = useState(emptyLoan);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof LoanDraft, boolean>>>({});
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = profile;
    if (p) {
      setName(p.name); setIncome(String(p.income)); setJob(p.job); setLoans(p.loans);
    }
  }, [profile]);

  const errors = loanErrors(draft);
  const markAll = () => setTouched({name: true, balance: true, rate: true, payment: true});
  const nextLoans = () => {
    if (draftIsEmpty(draft) && !editingId) return loans;
    markAll();
    const next = commitLoan(draft, loans, editingId ?? crypto.randomUUID());
    if (!next) {
      const first = Object.keys(errors)[0] as keyof LoanDraft | undefined;
      if (first) document.getElementById({name: "ln", balance: "lb", rate: "lr", payment: "lp"}[first])?.focus();
    }
    return next;
  };
  const persistLoans = async (next: Loan[]) => {
    setSaving(true); setError("");
    try { await saveProfile({...loadProfile(), name: name.trim(), income: +income, job: job.trim(), loans: next}); setLoans(next); return true; }
    catch { setError("Your details couldn't save. Please try again."); return false; }
    finally { setSaving(false); }
  };
  const resetDraft = () => {setDraft(emptyLoan); setEditingId(null); setTouched({});};
  const addLoan = async () => {
    if (draftIsEmpty(draft)) {markAll(); document.getElementById("ln")?.focus(); return;}
    const next = nextLoans();
    if (next && await persistLoans(next)) {resetDraft(); document.getElementById("ln")?.focus();}
  };
  const editLoan = (loan: Loan) => {
    setEditingId(loan.id); setDraft({name: loan.name, balance: String(loan.balance), rate: String(loan.rate), payment: String(loan.payment)}); setTouched({});
    document.getElementById("ln")?.focus();
  };

  const plan = useMemo(() => simulate(loans), [loans]);

  const goTo = async (s: number) => {
    if (s === 2) {
      const next = nextLoans();
      if (!next?.length || !await persistLoans(next)) return;
      resetDraft();
      setRevealed(false);
      setTimeout(() => setRevealed(true), 1200);
    }
    setStep(s);
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Sprout size={32} />
          <span className="font-heading text-xl font-semibold">Clearday</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16">
        {error && <p role="alert" className="mb-4 text-sm text-tip">{error}</p>}
        <ol className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span className={`leaf grid h-8 w-8 shrink-0 place-items-center text-sm font-bold ${i < step ? "bg-green text-ink" : i === step ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-sm font-semibold sm:block ${i === step ? "" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <span className={`h-1 flex-1 rounded-full ${i < step ? "bg-green" : "bg-secondary"}`} />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section className="leaf-lg border bg-card p-6 md:p-8">
            <div className="flex items-center gap-4">
              <Sprout mood="waving" size={70} />
              <div>
                <h1 className="text-2xl font-semibold">Let's start with you</h1>
                <p className="text-muted-foreground">This helps us show how your money and time add up.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div><label className={label} htmlFor="name">Your first name</label>
                <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" /></div>
              <div><label className={label} htmlFor="income">Monthly take-home pay ({currency})</label>
                <input id="income" type="number" min="0" inputMode="decimal" className={field} value={income} onChange={(e) => setIncome(e.target.value)} placeholder="3000" /></div>
              <div><label className={label} htmlFor="job">Job title</label>
                <input id="job" className={field} value={job} onChange={(e) => setJob(e.target.value)} placeholder="Barista" /></div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className={mainBtn} disabled={!name.trim() || !(+income > 0)} onClick={() => goTo(1)}>Next</button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="grid gap-5">
            {loans.length > 0 && <ul className="grid gap-3" aria-label="Saved loans">{loans.map(loan => <li key={loan.id} className={`leaf grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border bg-card p-4 ${editingId === loan.id ? "border-foreground" : ""}`}><div className="min-w-0"><p className="break-words font-semibold">{loan.name}</p><p className="mt-1 text-sm text-muted-foreground">{usd(loan.balance)} left{editingId === loan.id ? " · Editing" : ""}</p></div><div className="flex shrink-0"><Button variant="ghost" size="icon" disabled={saving} aria-label={`Edit ${loan.name}`} title={`Edit ${loan.name}`} onClick={() => editLoan(loan)}><Pencil /></Button><Button variant="ghost" size="icon" disabled={saving} aria-label={`Remove ${loan.name}`} title={`Remove ${loan.name}`} onClick={async () => {if (await persistLoans(loans.filter(l => l.id !== loan.id)) && editingId === loan.id) resetDraft();}}><Trash2 /></Button></div></li>)}</ul>}
            <div className="leaf-lg border bg-card p-6 md:p-8">
              <h1 className="text-2xl font-semibold">Your loans</h1>
              <p className="text-muted-foreground">Add each one. Rough numbers are totally fine.</p>
              <form id="loan-form" noValidate onSubmit={e => {e.preventDefault(); void goTo(2);}} className="mt-6 grid gap-4 sm:grid-cols-2">
                {([{key: "name", id: "ln", title: "Loan name", example: "Phone loan"}, {key: "balance", id: "lb", title: `Amount left to pay (${currency})`, example: "1,200"}, {key: "rate", id: "lr", title: "Interest rate per year (%)", example: "12"}, {key: "payment", id: "lp", title: `Monthly payment (${currency})`, example: "100"}] as const).map(f => <div key={f.key} className={f.key === "name" || f.key === "payment" ? "sm:col-span-2" : ""}><label className={label} htmlFor={f.id}>{f.title}</label><input id={f.id} className={field} type="text" inputMode={f.key === "name" ? "text" : "decimal"} placeholder={f.example} value={draft[f.key]} aria-invalid={!!(touched[f.key] && errors[f.key])} aria-describedby={touched[f.key] && errors[f.key] ? `${f.id}-error` : undefined} onChange={e => setDraft({...draft, [f.key]: e.target.value})} onBlur={() => setTouched(t => ({...t, [f.key]: true}))} />{touched[f.key] && errors[f.key] && <p id={`${f.id}-error`} className="mt-1.5 text-xs text-tip">{errors[f.key]}</p>}</div>)}
                <Button type="button" variant="link" disabled={saving} onClick={() => {void addLoan();}} className="h-auto w-fit justify-start p-0 text-sm text-green-text sm:col-span-2"><Plus className="size-4" />{editingId ? "Save changes & add another loan" : "Add another loan"}</Button>
              </form>
              {editingId && <Button variant="ghost" className="mt-3" onClick={resetDraft}>Cancel edit</Button>}
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3"><Button variant="ghost" onClick={() => setStep(0)} className="mt-2"><ArrowLeft />Back</Button><div className="min-w-0 justify-self-end"><Button type="submit" form="loan-form" className={mainBtn} disabled={!canContinueLoans(draft, loans) || saving}>{saving ? "Saving…" : "See my date"}</Button>{!canContinueLoans(draft, loans) && <p className="mt-2 max-w-48 text-right text-xs text-muted-foreground">Add at least one loan to continue.</p>}</div></div>
          </section>
        )}

        {step === 2 && (
          <section className="leaf-lg border bg-card p-6 text-center md:p-10">
            <div className="flex justify-center"><Sprout mood={revealed ? "cheering" : "thinking"} size={130} /></div>
            {!revealed ? (
              <p className="mt-6 text-lg text-muted-foreground">Crunching your numbers…</p>
            ) : plan.debtFreeDate ? (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                <p className="mt-6 text-lg font-semibold text-muted-foreground">You'll be debt free by</p>
                <h1 className="big-date mt-3">{formatMonth(plan.debtFreeDate)}</h1>
                <p className="mt-4 text-muted-foreground">
                  That's {plan.monthsLeft} months away. Interest still to pay: {usd(plan.totalInterest)} ({daysOfWork(plan.totalInterest, +income)} {daysOfWork(plan.totalInterest, +income) === 1 ? "day" : "days"} of work).
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700">
                <h1 className="mt-6 text-3xl font-bold">Let's tweak one thing first</h1>
                <p className="mt-2 text-muted-foreground">At these payments, some loans won't shrink yet. Small changes make a big difference!</p>
              </div>
            )}
            {revealed && plan.underwater.length > 0 && (
              <div className="mt-6 grid gap-2 text-left">
                {plan.underwater.map((u) => (
                  <div key={u.id} className="leaf bg-secondary p-4"><p className="font-semibold">{u.name}</p><UnderwaterNote min={u.minPayment} currency={currency} /></div>
                ))}
              </div>
            )}
            {revealed && (
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => setStep(1)} className="btn-secondary">Edit loans</button>
                <button className={mainBtn} onClick={() => navigate({ to: "/home" })}>Go to my home</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function UnderwaterNote({ min, currency }: { min: number; currency: Currency }) {
  return (
    <p className="leaf mt-2 bg-tip/10 px-3 py-2 text-sm text-tip">
      This payment doesn't cover the interest yet. Paying at least {money(min, currency)} a month will start shrinking it.
    </p>
  );
}
