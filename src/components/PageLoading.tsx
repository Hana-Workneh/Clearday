import { useEffect, useState } from "react";
import { Sprout } from "./Sprout";
import { Button } from "./ui/button";
import { refreshAccount } from "@/lib/store";

export const LOADING_TIMEOUT_MS = 6000;

/** Friendly fallback shown when loading takes too long or a load fails. */
export function LoadingTrouble({ onRetry }: { onRetry?: () => void }) {
  return <div role="alert" className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-4 px-5 py-12 text-center">
    <Sprout mood="calm" size={90} />
    <p className="font-heading text-lg font-semibold">This is taking longer than usual.</p>
    <div className="flex flex-wrap justify-center gap-2">
      <Button className="btn-main" onClick={() => { onRetry?.(); void refreshAccount(); }}>Try again</Button>
      <Button variant="outline" className="btn-secondary" onClick={() => window.location.assign("/")}>Go to start</Button>
    </div>
  </div>;
}

export function PageLoading() {
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [attempt]);
  if (slow) return <LoadingTrouble onRetry={() => setAttempt((a) => a + 1)} />;
  return <div role="status" aria-label="Loading your Clearday" className="flex min-h-64 flex-col items-center justify-center gap-4"><Sprout mood="thinking" size={80} /><span className="text-sm text-muted-foreground">A little moment…</span><div className="h-1.5 w-24 animate-pulse rounded-full bg-track" /></div>;
}
