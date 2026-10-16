import { money, type Currency } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { LoanMenu } from "@/components/LoanMenu";
import { SetupCompanion } from "@/components/SetupCompanion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CleardayLogo } from "@/components/CleardayLogo";
import { simulate, formatMonth, workDaysLabel, addMonths, type Loan } from "@/lib/debt";
import { loadProfile, saveProfile, useProfile } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sprout } from "@/components/Sprout";
import { Confetti } from "@/components/Confetti";
import { emptyLoan, loanErrors, loanNumber, draftIsEmpty, canContinueLoans, commitLoan, type LoanDraft } from "@/lib/loan-entry";

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
  validateSearch: (s: Record<string, unknown>): { step?: number | undefined; edit?: string | undefined; empty?: boolean | undefined } => ({
    step: s["step"] === 1 || s["step"] === "1" ? 1 : undefined,
    edit: typeof s["edit"] === "string" ? s["edit"] : undefined,
    empty: s["empty"] === true || s["empty"] === "true" ? true : undefined,
  }),
  component: Setup,
});

const steps = ["Your income", "Your loans", "Your date"];
const field = "leaf min-h-14 w-full border bg-card px-5 py-4 text-base outline-none focus:ring-2 focus:ring-ring";
const label = "mb-1.5 block text-sm font-semibold";
const mainBtn = "btn-main";

function Setup() {
  const navigate = useNavigate();
  const profile = useProfile();
  const currency = profile?.currency ?? "USD";
  const usd = (n: number) => money(n, currency);
  const search = Route.useSearch();
  const [step, setStep] = useState(search.step ?? 0);
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
  const [editHandled, setEditHandled] = useState(false);
  useEffect(() => {
    if (editHandled || !search.edit || !profile) return;
    const loan = profile.loans.find(l => l.id === search.edit);
    setEditHandled(true);
    if (loan) setTimeout(() => editLoan(loan), 0);
  }, [profile, search.edit, editHandled]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const previewLoans = loans.filter(loan => loan.id !== editingId).map(loan => ({id: loan.id, name: loan.name, amount: usd(loan.balance)}));
  if (!draftIsEmpty(draft)) previewLoans.push({id: editingId ?? "draft", name: draft.name, amount: Number.isFinite(loanNumber(draft.balance)) && draft.balance.trim() ? usd(loanNumber(draft.balance)) : "—"});
  const companionProps = {step, name, income: +income > 0 ? `${usd(+income)} / month` : "", loans: previewLoans, date: plan.debtFreeDate ? formatMonth(plan.debtFreeDate) : null, ready: revealed, message: step === 1 && loans.length === 0 && search.empty ? "Add a loan to see your date." : undefined};
  const incomeHint = !(+income > 0) ? "Fill in your pay to continue" : "Add your first name to continue";

  const goTo = async (s: number) => {
    if (s === 2) {
      const next = nextLoans();
      if (!next?.length || !await persistLoans(next)) return;
      resetDraft();
      setRevealed(false);
      setTimeout(() => setRevealed(true), 1500);
    }
    setStep(s);
  };

  return (
    <div className="min-h-screen">
      <header className="flex h-20 items-center justify-between gap-4 border-b bg-card px-5 sm:px-8 lg:px-10">
        <Link to="/" aria-label="Clearday welcome page" className="flex items-center gap-2">
          <CleardayLogo />
        </Link>
        <div className="flex items-center gap-4 sm:gap-6"><Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Exit</Link><ThemeToggle /></div>
      </header>

      <main className="min-h-[calc(100svh-5rem)] lg:grid lg:grid-cols-[2fr_3fr]">
        <div className="hidden bg-setup-panel lg:grid"><SetupCompanion {...companionProps} /></div>
        <div className="px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-20">
        <div className="mx-auto max-w-xl">
        <div className="lg:hidden"><SetupCompanion {...companionProps} /></div>
        {error && <p role="alert" className="mb-4 text-sm text-tip">{error}</p>}
        <div className="mb-10">
        <div role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={3} aria-valuenow={step + 1} className="mb-3 grid h-1.5 grid-cols-3 gap-1 overflow-hidden rounded-full bg-track">{steps.map((s, i) => <span key={s} className={i <= step ? "bg-green" : "bg-track"} />)}</div>
        <ol className="grid grid-cols-3 gap-2">
          {steps.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined} className={`text-xs font-semibold sm:text-sm ${i === 1 ? "text-center" : i === 2 ? "text-right" : ""} ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
              {s}
            </li>
          ))}
        </ol>
        </div>

        {step === 0 && (
          <section>
            <div>
              <div>
                <h1 className="text-3xl font-semibold">Let's start with you</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">This helps us show how your money and time add up.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6">
              <div><label className={label} htmlFor="name">Your first name</label>
                <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" /></div>
              <div><label className={label} htmlFor="income">Monthly take-home pay ({currency})</label>
                <input id="income" type="number" min="0" inputMode="decimal" className={field} value={income} onChange={(e) => setIncome(e.target.value)} placeholder="3000" /></div>
              <div><label className={label} htmlFor="job">Job title</label>
                <input id="job" className={field} value={job} onChange={(e) => setJob(e.target.value)} placeholder="Barista" /></div>
            </div>
            <div className="mt-8 flex flex-col items-end gap-2">
              <Button className={`${mainBtn} w-full sm:w-auto sm:min-w-40`} disabled={!name.trim() || !(+income > 0)} aria-describedby={!name.trim() || !(+income > 0) ? "income-hint" : undefined} onClick={() => goTo(1)}>Next</Button>
              {(!name.trim() || !(+income > 0)) && <p id="income-hint" className="text-xs text-muted-foreground">{incomeHint}</p>}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="grid gap-5">
            {loans.length > 0 && <ul className="grid gap-3" aria-label="Saved loans">{loans.map(loan => <li key={loan.id} className={`leaf grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border bg-card p-4 ${editingId === loan.id ? "border-foreground" : ""}`}><div className="min-w-0"><p className="break-words font-semibold">{loan.name}</p><p className="mt-1 text-sm text-muted-foreground">{usd(loan.balance)} left{editingId === loan.id ? " · Editing" : ""}</p></div><LoanMenu loan={loan} disabled={saving} stayOnEmpty onEdit={() => editLoan(loan)} onDeleted={() => { if (editingId === loan.id) resetDraft(); }} /></li>)}</ul>}
            <div>
              <h1 className="text-3xl font-semibold">Your loans</h1>
              <p className="mt-3 text-sm text-muted-foreground">Add each one. Rough numbers are totally fine.</p>
              <form id="loan-form" noValidate onSubmit={e => {e.preventDefault(); void goTo(2);}} className="mt-8 grid gap-6 sm:grid-cols-2">
                {([{key: "name", id: "ln", title: "Loan name", example: "Phone loan"}, {key: "balance", id: "lb", title: `Amount left to pay (${currency})`, example: "1,200"}, {key: "rate", id: "lr", title: "Interest rate per year (%)", example: "12"}, {key: "payment", id: "lp", title: `Monthly payment (${currency})`, example: "100"}] as const).map(f => <div key={f.key} className={f.key === "name" || f.key === "payment" ? "sm:col-span-2" : ""}><label className={label} htmlFor={f.id}>{f.title}</label><input id={f.id} className={field} type="text" inputMode={f.key === "name" ? "text" : "decimal"} placeholder={f.example} value={draft[f.key]} aria-invalid={!!(touched[f.key] && errors[f.key])} aria-describedby={touched[f.key] && errors[f.key] ? `${f.id}-error` : undefined} onChange={e => setDraft({...draft, [f.key]: e.target.value})} onBlur={() => setTouched(t => ({...t, [f.key]: true}))} />{touched[f.key] && errors[f.key] && <p id={`${f.id}-error`} className="mt-1.5 text-xs text-tip">{errors[f.key]}</p>}</div>)}
                <Button type="button" variant="link" disabled={saving} onClick={() => {void addLoan();}} className="h-auto w-fit justify-start p-0 text-sm text-green-text sm:col-span-2"><Plus className="size-4" />{editingId ? "Save changes & add another loan" : "Add another loan"}</Button>
              </form>
              {editingId && <Button variant="ghost" className="mt-3" onClick={resetDraft}>Cancel edit</Button>}
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3"><Button variant="ghost" onClick={() => setStep(0)} className="mt-2"><ArrowLeft />Back</Button><div className="min-w-0 justify-self-end"><Button type="submit" form="loan-form" className={mainBtn} disabled={!canContinueLoans(draft, loans) || saving}>{saving ? "Saving…" : "See my date"}</Button>{!canContinueLoans(draft, loans) && <p className="mt-2 max-w-48 text-right text-xs text-muted-foreground">Add at least one loan to continue.</p>}</div></div>
          </section>
        )}

        {step === 2 && (
          <section className="py-8 text-center lg:py-12">
            {!revealed ? (
              <div className="flex flex-col items-center animate-in fade-in duration-300"><Sprout mood="thinking" size={120} /><p className="mt-6 text-lg font-semibold text-muted-foreground" role="status">Working it out...</p></div>
            ) : plan.debtFreeDate ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                <Confetti />
                <Sprout mood="cheering" size={120} />
                <p className="mt-6 text-lg font-semibold text-muted-foreground">You'll be debt free by</p>
                <h1 className="big-date mt-3" aria-live="polite"><CountUpMonth target={plan.debtFreeDate} /></h1>
                <p className="mt-3 text-sm text-muted-foreground">That's {plan.monthsLeft} months away.</p>
                <p className="mx-auto mt-5 max-w-md font-heading text-xl font-semibold leading-snug">Right now you'd work {workDaysLabel(plan.totalInterest, +income)} just to pay interest. Let's win some of those days back.</p>
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
              <div className="mt-8 flex flex-col items-center gap-3">
                {plan.debtFreeDate ? <Button className={`${mainBtn} w-full sm:w-auto sm:min-w-56`} onClick={() => navigate({ to: "/pay-faster" })}>Show me how</Button> : <Button className={mainBtn} onClick={() => setStep(1)}>Edit loans</Button>}
                <div className="flex gap-2">{plan.debtFreeDate && <Button variant="ghost" onClick={() => setStep(1)}>Edit loans</Button>}<Button variant="ghost" onClick={() => navigate({ to: "/home" })}>Go to my home</Button></div>
              </div>
            )}
          </section>
        )}
        </div>
        </div>
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

function CountUpMonth({ target }: { target: Date }) {
  const total = Math.max(0, (target.getFullYear() - new Date().getFullYear()) * 12 + target.getMonth() - new Date().getMonth());
  const [shown, setShown] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? total : 0);
  useEffect(() => {
    if (shown >= total) return;
    const start = performance.now(); let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 1200); setShown(Math.round(total * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{formatMonth(addMonths(new Date(), shown))}</>;
}
