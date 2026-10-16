import { useEffect, useState } from "react";

// Display-only onboarding ticks; kept in the browser so they never touch saved finances.
const KEY = "clearday-start-here";
const EVENT = "clearday-start-here-change";
export type StartStep = "payFaster" | "ideas";

const read = (): Partial<Record<StartStep, boolean>> => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
};

export function markStartStep(step: StartStep) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), [step]: true })); window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ }
}

export function useStartSteps() {
  const [steps, setSteps] = useState<Partial<Record<StartStep, boolean>> | null>(null);
  useEffect(() => {
    const sync = () => setSteps(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return steps;
}
