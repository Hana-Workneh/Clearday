import { money, type Currency } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { simulate, formatMonth, daysOfWork, type Loan } from "@/lib/debt";
import { loadProfile, saveProfile, useProfile } from "@/lib/store";

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

const emptyLoan = { name: "", balance: "", rate: "", payment: "" };

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
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = profile;
    if (p) {
      setName(p.name); setIncome(String(p.income)); setJob(p.job); setLoans(p.loans);
    }
  }, [profile]);

  const draftValid = draft.name.trim() && +draft.balance > 0 && draft.rate !== "" && +draft.rate >= 0 && +draft.payment > 0;
  const addLoan = () => {
    if (!draftValid) return;
    const b = +draft.balance;
    setLoans([...loans, { id: crypto.randomUUID(), name: draft.name.trim(), balance: b, startBalance: b, rate: +draft.rate, payment: +draft.payment }]);
    setDraft(emptyLoan);
  };

  const plan = useMemo(() => simulate(loans), [loans]);

  const goTo = async (s: number) => {
    if (s === 2) {
      setSaving(true); setError("");
      try { await saveProfile({ ...loadProfile(), name: name.trim(), income: +income, job: job.trim(), loans }); }
      catch { setError("Your details couldn't save. Please try again."); setSaving(false); return; }
      setSaving(false);
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
            <div className="leaf-lg border bg-card p-6 md:p-8">
              <h1 className="text-2xl font-semibold">Your loans</h1>
              <p className="text-muted-foreground">Add each one. Rough numbers are totally fine.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={label} htmlFor="ln">Loan name</label>
                  <input id="ln" className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Phone loan" /></div>
                <div><label className={label} htmlFor="lb">Amount left to pay ({currency})</label>
                  <input id="lb" type="number" min="0" className={field} value={draft.balance} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} placeholder="1200" /></div>
                <div><label className={label} htmlFor="lr">Interest rate per year (%)</label>
                  <input id="lr" type="number" min="0" step="0.1" className={field} value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} placeholder="12" /></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="lp">Monthly payment ({currency})</label>
                  <input id="lp" type="number" min="0" className={field} value={draft.payment} onChange={(e) => setDraft({ ...draft, payment: e.target.value })} placeholder="80" /></div>
              </div>
              <button onClick={addLoan} disabled={!draftValid} className="btn-secondary mt-5 flex items-center gap-2">
                <Plus className="h-4 w-4" /> {loans.length ? "Add another loan" : "Add this loan"}
              </button>
            </div>

            {loans.length > 0 && (
              <div className="leaf-lg border bg-card p-6">
                <h2 className="text-lg font-semibold">Added so far 🌱</h2>
                <ul className="mt-3 grid gap-2">
                  {loans.map((l) => {
                    const uw = plan.underwater.find((u) => u.id === l.id);
                    return (
                      <li key={l.id} className="leaf bg-secondary p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{l.name}</p>
                            <p className="text-sm text-muted-foreground">{usd(l.balance)} left · {l.rate}% a year · {usd(l.payment)}/month</p>
                          </div>
                          <button aria-label={`Remove ${l.name}`} onClick={() => setLoans(loans.filter((x) => x.id !== l.id))} className="leaf p-2 text-muted-foreground hover:bg-card">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {uw && <UnderwaterNote min={uw.minPayment} currency={currency} />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="leaf flex items-center gap-2 px-5 py-3 font-semibold text-muted-foreground hover:bg-secondary"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button className={mainBtn} disabled={!loans.length || saving} onClick={() => goTo(2)}>{saving ? "Saving…" : "See my date"}</button>
            </div>
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
