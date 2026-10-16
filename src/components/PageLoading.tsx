import { Sprout } from "./Sprout";
export function PageLoading() {
  return <div role="status" aria-label="Loading your Clearday" className="flex min-h-64 flex-col items-center justify-center gap-4"><Sprout mood="thinking" size={80} /><span className="text-sm text-muted-foreground">A little moment…</span><div className="h-1.5 w-24 animate-pulse rounded-full bg-track" /></div>;
}