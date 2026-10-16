import { useEffect, useState } from "react";
import { simulate, type Loan, type PlanOptions } from "./debt";

export type Payment = { id: string; loanId: string; amount: number; date: string }; // date: yyyy-mm-dd
export type CatchUp = { amount: number; months: number; from: string };

export type Profile = {
  name: string;
  income: number;
  job: string;
  loans: Loan[];
  plan?: PlanOptions;
  payments?: Payment[];
  startedAt?: string; // ISO date the user started
  startDebtFree?: string | null; // debt free date when they started
  catchUp?: CatchUp;
  quietSeen?: Record<string, string>; // loanId -> date handled up to
};
const KEY = "clearday-profile";
const EVENT = "clearday-profile-change";

export const today = () => new Date().toISOString().slice(0, 10);

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    if (!p.startedAt && p.loans?.length) {
      p.startedAt = today();
      p.startDebtFree = simulate(p.loans, new Date(), p.plan).debtFreeDate?.toISOString() ?? null;
      localStorage.setItem(KEY, JSON.stringify(p));
    }
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event(EVENT));
}

/** Returns undefined until loaded in the browser, then the profile or null. Stays in sync with saves. */
export function useProfile() {
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  useEffect(() => {
    const load = () => setP(loadProfile());
    load();
    window.addEventListener(EVENT, load);
    return () => window.removeEventListener(EVENT, load);
  }, []);
  return p;
}

const monthsBetween = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();

/** Plan options including an active "catch up slowly" boost. */
export function planOptions(p: Profile, now = new Date()): PlanOptions {
  const opts: PlanOptions = { ...p.plan };
  if (p.catchUp) {
    const left = p.catchUp.months - monthsBetween(new Date(p.catchUp.from), now);
    if (left > 0) opts.boost = { amount: p.catchUp.amount, months: left };
  }
  return opts;
}

export function percentPaid(loans: Loan[]) {
  const start = loans.reduce((s, l) => s + l.startBalance, 0);
  const left = loans.reduce((s, l) => s + l.balance, 0);
  return start > 0 ? Math.round(((start - left) / start) * 100) : 0;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const demoProfile: Profile = {
  name: "Alex",
  income: 3200,
  job: "Barista",
  loans: [
    { id: "d1", name: "Credit card", balance: 1800, startBalance: 2600, rate: 22, payment: 120 },
    { id: "d2", name: "Phone loan", balance: 450, startBalance: 900, rate: 9, payment: 60 },
    { id: "d3", name: "Student loan", balance: 14000, startBalance: 18000, rate: 5.5, payment: 220 },
  ],
  startedAt: daysAgo(100),
  startDebtFree: new Date(new Date().getFullYear() + 5, 2, 1).toISOString(),
  payments: [
    { id: "p1", loanId: "d1", amount: 120, date: daysAgo(70) },
    { id: "p2", loanId: "d3", amount: 220, date: daysAgo(68) },
    { id: "p3", loanId: "d2", amount: 60, date: daysAgo(45) },
    { id: "p4", loanId: "d1", amount: 120, date: daysAgo(40) },
    { id: "p5", loanId: "d3", amount: 220, date: daysAgo(38) },
    { id: "p6", loanId: "d1", amount: 120, date: daysAgo(9) },
    { id: "p7", loanId: "d3", amount: 220, date: daysAgo(8) },
  ],
};
