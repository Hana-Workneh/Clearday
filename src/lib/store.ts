import { useEffect, useState } from "react";
import type { Loan, PlanOptions } from "./debt";

export type Profile = { name: string; income: number; job: string; loans: Loan[]; plan?: PlanOptions };
const KEY = "clearday-profile";

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

/** Returns undefined until loaded in the browser, then the profile or null. */
export function useProfile() {
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  useEffect(() => setP(loadProfile()), []);
  return p;
}

export const demoProfile: Profile = {
  name: "Alex",
  income: 3200,
  job: "Barista",
  loans: [
    { id: "d1", name: "Credit card", balance: 1800, startBalance: 2600, rate: 22, payment: 120 },
    { id: "d2", name: "Phone loan", balance: 450, startBalance: 900, rate: 9, payment: 60 },
    { id: "d3", name: "Student loan", balance: 14000, startBalance: 18000, rate: 5.5, payment: 220 },
  ],
};
