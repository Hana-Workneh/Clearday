import { money } from "@/lib/account-data";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, Flag, LoaderCircle, Sparkles, Square } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { Button } from "@/components/ui/button";
import { useProfile, planOptions, percentPaid } from "@/lib/store";
import { formatMonth, simulate } from "@/lib/debt";
import { buildTimeline, extraFromIdea, ideaImpact, safeIdeas, type Idea } from "@/lib/plan";

export const Route = createFileRoute("/_shell/plan")({
  head: () => ({ meta: [
    { title: "My plan · Clearday" },
    { name: "description", content: "See your step-by-step path to being debt free." },
    { property: "og:title", content: "My plan · Clearday" },
    { property: "og:description", content: "See your step-by-step path to being debt free." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MyPlan,
});

function MyPlan() {
  const profile = useProfile();
  const usd = (n: number) => money(n, profile?.currency);
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [expanded, setExpanded] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [terminal, setTerminal] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const options = profile ? planOptions(profile, now) : {};
  const fingerprint = JSON.stringify(profile ? { job: profile.job, income: profile.income, loans: profile.loans, plan: options, currency: profile.currency ?? "USD" } : null);
  useEffect(() => { setIdeas([]); setError(""); setTerminal(false); abort.current?.abort(); setLoading(false); return () => abort.current?.abort(); }, [fingerprint]);
  if (profile === undefined) return null;
  if (!profile) return <div className="mx-auto max-w-xl text-center"><Sprout mood="thinking" size={100} /><h1 className="page-title mt-4">Your plan starts here</h1><Button asChild className="btn-main mt-6"><Link to="/setup">Add your loans <ArrowRight /></Link></Button></div>;
  const result = simulate(profile.loans, now, options);
  const timeline = buildTimeline(profile, now, options);
  const visible = expanded ? timeline : timeline.filter((row, i) => row.current || row.milestones.length || (i > timeline.findIndex(r => r.current) && i <= timeline.findIndex(r => r.current) + 3));
  const monthly = profile.loans.reduce((s,l) => s+l.payment, 0) + (options.extra ?? 0);

  const generate = async () => {
    if (loading || terminal) return;
    const controller = new AbortController(); abort.current = controller;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/advice", { method: "POST", headers: { "Content-Type": "application/json" }, body: fingerprint, signal: controller.signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if ([401,402,403,404].includes(response.status)) setTerminal(true);
        throw new Error(data.message || "Lovable AI is temporarily unavailable.");
      }
      if (!response.body) throw new Error("No suggestions were returned.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let received = false;
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "result") { setIdeas(safeIdeas({ ideas: event.ideas })); received = true; }
        }
        if (chunk.done) break;
      }
      if (!received) throw new Error("No suggestions were returned. Start a fresh request when you're ready.");
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Suggestions aren't available right now."); }
    finally { if (abort.current === controller) setLoading(false); }
  };

  return <div className="mx-auto max-w-6xl space-y-7">
    <header><h1 className="page-title">My plan</h1><p className="page-sub mt-1">One month at a time. Every little step counts.</p></header>
    <div className="flex flex-wrap items-center justify-between gap-5 border-y py-6">
      <div><p className="text-sm text-muted-foreground">Your debt free day</p><p className="font-heading mt-1 text-4xl font-bold">{result.debtFreeDate ? formatMonth(result.debtFreeDate) : "Let's adjust your payments"}</p></div>
      <div className="flex items-center gap-5"><div className="text-right"><p className="font-heading text-2xl font-semibold">{usd(monthly)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p><span className="chip-green mt-2">{percentPaid(profile.loans)}% paid</span></div><Sprout mood={result.monthsLeft === 0 ? "crowned" : "happy"} size={80} /></div>
    </div>
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section aria-label="Monthly timeline" className="min-w-0">
        <div className="flex items-center justify-between gap-2"><h2 className="font-heading text-xl font-semibold">Your path to freedom</h2><span className="text-xs text-muted-foreground">{result.monthsLeft ?? "600+"} months to go</span></div>
        <ol className="mt-5">
          {visible.map(row => <li key={row.date.toISOString()} className="relative ml-3 border-l-2 border-border pb-6 pl-7 last:border-transparent">
            <span className={`absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full ${row.current ? "bg-green ring-4 ring-chip-green" : row.milestones.length ? "bg-chip-purple text-chip-purple-text" : "border-2 border-border bg-background"}`}>{row.milestones.length > 0 && <Check className="size-3" />}</span>
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-heading font-semibold">{formatMonth(row.date)}</h3>{row.current && <span className="chip-green">You are here</span>}</div>
            <p className="mt-1 text-sm text-muted-foreground">{row.past ? row.logged > 0 ? `${usd(row.logged)} logged` : "No payments logged" : row.current ? `${usd(row.totalLeft ?? 0)} left` : `${usd(row.plannedPayment ?? 0)} planned · ${usd(row.totalLeft ?? 0)} left`}</p>
            <div className="mt-2 flex flex-wrap gap-2">{row.milestones.map(label => <span key={label} className="chip-purple"><Flag className="mr-1.5 size-3" />{label}{row.current && label !== "Debt free" ? " reached" : ""}</span>)}</div>
          </li>)}
        </ol>
        <Button variant="outline" className="btn-secondary w-full" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp /> : <ChevronDown />}{expanded ? "Show key moments" : `Show every month (${timeline.length})`}</Button>
        <p className="mt-3 text-xs text-muted-foreground">Future dates are estimates. Past months show your logged payments; milestones already reached appear at today’s marker.</p>
      </section>
      <section aria-label="Ideas for you" className="min-w-0">
        <div className="flex items-center gap-2"><Sparkles className="size-5 text-tip" /><h2 className="font-heading text-xl font-semibold">A little extra, your way</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">{profile.job ? `Small possibilities for you as a ${profile.job.toLowerCase()}.` : "Small possibilities that fit your budget."}</p>
        {ideas.length === 0 && !loading && !error && <div className="mt-6 flex items-center gap-4"><Sprout mood="thinking" size={76} /><Button className="btn-main flex-1" onClick={generate}><Sparkles />Find my ideas</Button></div>}
        {loading && <div className="mt-6 flex items-center justify-between gap-3" role="status"><span className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Finding practical ideas for you…</span><Button variant="ghost" size="icon" aria-label="Stop suggestions" onClick={() => { abort.current?.abort(); setLoading(false); }}><Square /></Button></div>}
        {error && <div className="mt-6" role="alert"><p className="text-sm text-muted-foreground">{error}</p>{!terminal && <Button variant="outline" className="btn-secondary mt-3" onClick={generate}>Generate new ideas</Button>}</div>}
        <div className="mt-5 grid gap-4">{ideas.map((idea,i) => {
          const impact = ideaImpact(profile.loans, options, idea.monthlyAmount, now);
          return <article key={`${idea.title}-${i}`} className="leaf bg-chip-purple p-5 text-chip-purple-text">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase">{idea.kind === "earn" ? "Earn a little" : "Save a little"}</span><Sparkles className="size-4" /></div>
            <h3 className="font-heading mt-3 text-lg font-semibold">{idea.title}</h3><p className="mt-2 text-sm leading-relaxed">{idea.detail}</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"><p className="font-heading text-2xl font-bold text-foreground">~{usd(idea.monthlyAmount)}<span className="text-sm font-normal"> / month</span></p><span className="text-sm font-semibold">{impact.monthsSooner === null ? impact.nextDate ? `Debt free ${formatMonth(impact.nextDate)}` : "Explore your new date" : impact.monthsSooner > 0 ? `${impact.monthsSooner} ${impact.monthsSooner === 1 ? "month" : "months"} sooner` : "Less interest, same month"}</span></div>
            <Button variant="outline" className="btn-secondary mt-4 w-full" onClick={() => navigate({ to: "/pay-faster", search: { extra: extraFromIdea(options, idea.monthlyAmount) } })}>Try this <ArrowRight /></Button>
          </article>;
        })}</div>
        {ideas.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Amounts are estimates, not guaranteed. Each idea is compared separately with your chosen plan.</p>}
        <p className="mt-6 text-xs text-muted-foreground">Powered by Lovable AI</p>
      </section>
    </div>
    <footer className="border-t py-5 text-center text-xs text-muted-foreground">Clearday is a planning tool, not financial advice.</footer>
  </div>;
}
