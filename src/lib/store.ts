import { useEffect, useState } from "react";
import { simulate, type Loan, type PlanOptions } from "./debt";
import { supabase } from "@/integrations/supabase/client";
import { profileSchema, mergeLocalData, type Currency } from "./account-data";
import { saveAccountProfile } from "./account.functions";

export type Payment = { id: string; loanId: string; amount: number; date: string }; // date: yyyy-mm-dd
export type CatchUp = { amount: number; months: number; from: string };

export type Profile = {
  name: string;
  income: number;
  job: string;
  currency?: Currency | undefined;
  theme?: "light" | "dark" | undefined;
  demo?: boolean;
  savingsGoal?: { name: string; amount: number } | undefined;
  loans: Loan[];
  plan?: PlanOptions | undefined;
  payments?: Payment[] | undefined;
  startedAt?: string | undefined; // ISO date the user started
  startDebtFree?: string | null | undefined; // debt free date when they started
  catchUp?: CatchUp | undefined;
  quietSeen?: Record<string, string> | undefined; // loanId -> date handled up to
};
const KEY = "clearday-profile";
const EVENT = "clearday-profile-change";
const DEMO_KEY = "clearday-demo";
let accountId: string | null = null;
let accountProfile: Profile | null = null;
let ready = false;
let accountError = "";
let generation = 0;
let writeQueue: Promise<void> = Promise.resolve();
const notify = () => window.dispatchEvent(new Event(EVENT));
export function useAccount() {
  const [state, setState] = useState<{id: string | null; ready: boolean; error: string}>({id: null, ready: false, error: ""});
  useEffect(() => { const update = () => setState({id: accountId, ready, error: accountError}); update(); window.addEventListener(EVENT, update); return () => window.removeEventListener(EVENT, update); }, []);
  return state;
}
export async function refreshAccount() {
  const version = ++generation;
  ready = false; accountProfile = null; accountError = ""; notify();
  const { data: { user } } = await supabase.auth.getUser();
  if (version !== generation) return;
  accountId = user?.id ?? null;
  if (user) {
    try {
      const { data, error } = await supabase.from("profiles").select("data").eq("id", user.id).maybeSingle();
      if (error) throw error;
      let profile = data?.data ? profileSchema.parse(data.data) : null;
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const candidate = JSON.parse(raw);
        const oldDemo = candidate.demo || candidate.name === "Alex" && candidate.loans?.some((l: Loan) => l.id === "d1");
        if (!oldDemo) {
          if (version !== generation) return;
          profile = await saveAccountProfile({data: mergeLocalData(profile, profileSchema.parse(candidate))});
          localStorage.removeItem(KEY);
        } else localStorage.removeItem(KEY);
      }
      if (version !== generation) return;
      accountProfile = profile;
      sessionStorage.removeItem(DEMO_KEY);
      if (profile?.theme) { localStorage.setItem("clearday-theme", profile.theme); document.documentElement.classList.toggle("dark", profile.theme === "dark"); }
    } catch { accountError = "Your saved account could not load. Please try again."; }
  }
  if (version === generation) { ready = true; notify(); }
}
export function clearAccount() { ++generation; accountId = null; accountProfile = null; ready = true; accountError = ""; sessionStorage.removeItem(DEMO_KEY); notify(); }
export function startDemo() { sessionStorage.setItem(DEMO_KEY, JSON.stringify(demoProfile)); notify(); }
export function leaveDemo() { sessionStorage.removeItem(DEMO_KEY); notify(); }

export const today = () => new Date().toISOString().slice(0, 10);

export function loadProfile(): Profile | null {
  try {
    const demo = sessionStorage.getItem(DEMO_KEY);
    if (demo) return JSON.parse(demo) as Profile;
    if (accountId) return accountProfile;
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

export async function saveProfile(p: Profile) {
  const cleaned = profileSchema.parse(p);
  p = {...cleaned, ...(p.demo ? {demo: true} : {})};
  if (p.demo) { sessionStorage.setItem(DEMO_KEY, JSON.stringify(p)); notify(); return; }
  if (!p.startedAt) p = {...p, startedAt: today(), startDebtFree: simulate(p.loans, new Date(), p.plan).debtFreeDate?.toISOString() ?? null};
  if (accountId) {
    if (accountError || !ready) throw new Error("Please reload your account before saving.");
    const owner = accountId;
    const valid = profileSchema.parse(p);
    const write = writeQueue.catch(() => {}).then(async () => {
      if (owner !== accountId) throw new Error("Please sign in again before saving.");
      const saved = await saveAccountProfile({data: valid});
      if (owner === accountId) { accountProfile = saved; notify(); }
    });
    writeQueue = write;
    await write;
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(p));
  notify();
}

/** Returns undefined until loaded in the browser, then the profile or null. Stays in sync with saves. */
export function useProfile() {
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  useEffect(() => {
    const load = () => setP(ready ? loadProfile() : undefined);
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
  name: "Hana", income: 500, job: "Marketing officer", currency: "USD", demo: true,
  loans: [
    { id: "d1", name: "Phone loan", balance: 140, startBalance: 300, rate: 9, payment: 40 },
    { id: "d2", name: "Personal loan", balance: 280, startBalance: 600, rate: 15, payment: 80 },
    { id: "d3", name: "Salary advance", balance: 0, startBalance: 200, rate: 0, payment: 50 },
  ],
  startedAt: daysAgo(120),
  startDebtFree: simulate([{ id: "start", name: "Starting loans", balance: 1100, startBalance: 1100, rate: 12, payment: 170 }], new Date(Date.now() - 120 * 86400000)).debtFreeDate?.toISOString(),
  payments: [98, 68, 38, 8].flatMap((days, i) => [
    { id: `hana-${i}-phone`, loanId: "d1", amount: 40, date: daysAgo(days) },
    { id: `hana-${i}-personal`, loanId: "d2", amount: 80, date: daysAgo(days) },
    { id: `hana-${i}-salary`, loanId: "d3", amount: 50, date: daysAgo(days) },
  ]),
};
