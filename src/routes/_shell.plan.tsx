import { money } from "@/lib/account-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { markStartStep } from "@/lib/start-here";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, Flag, Sparkles, Square } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { Button } from "@/components/ui/button";
import { useProfile, planOptions, percentPaid } from "@/lib/store";
import { formatMonth, simulate } from "@/lib/debt";
import { buildTimeline, ideaImpact, safeIdeas, displayJob, type Idea } from "@/lib/plan";
import { IdeaPreview } from "@/components/IdeaPreview";
import { supabase } from "@/integrations/supabase/client";

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
  useEffect(() => { markStartStep("ideas"); }, []);
  const usd = (n: number) => money(n, profile?.currency);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const now = useMemo(() => new Date(), []);
  const [expanded, setExpanded] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [terminal, setTerminal] = useState(false);
  const [limited, setLimited] = useState(false);
  const [note, setNote] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const [step, setStep] = useState(0);
  const [cacheKey, setCacheKey] = useState<string | null>(null);
  const jobLabel = displayJob(profile?.job ?? "");
  const options = profile ? planOptions(profile, now) : {};
  const fingerprint = JSON.stringify(profile ? { job: profile.job, skills: profile.skills || undefined, income: profile.income, loans: profile.loans, plan: options, currency: profile.currency ?? "USD" } : null);
  useEffect(() => { setIdeas(profile?.demo ? [
    {title: "A small weekend project", detail: "Offer a short social-media content session to a local business, with your employer’s permission. One small project could leave around 30 after costs.", monthlyAmount: 30, kind: "earn", tag: "Because you're a marketing officer"},
    {title: "Bring lunch twice a week", detail: "Use food you already buy to pack lunch on two workdays. Keeping essentials covered could save around 20 each month.", monthlyAmount: 20, kind: "save"},
    {title: "Pause an unused subscription", detail: "Check your subscriptions for one you no longer use. Pausing a small service could save around 10 each month.", monthlyAmount: 10, kind: "save"},
  ] : []); setNote(false); setError(""); setTerminal(false); abort.current?.abort(); setLoading(false); return () => abort.current?.abort(); }, [fingerprint, profile?.demo]);
  const autoRun = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!profile || profile.demo) return;
    let live = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!live) return;
      const key = session ? `clearday-ideas:${session.user.id}` : null;
      setCacheKey(key);
      try {
        const saved = key ? JSON.parse(localStorage.getItem(key) ?? "null") : null;
        if (saved && saved.fingerprint === fingerprint && Array.isArray(saved.ideas) && saved.ideas.length) { setIdeas(safeIdeas({ ideas: saved.ideas })); setNote(saved.note === true); return; }
      } catch { /* ignore broken cache */ }
      autoRun.current?.();
    });
    return () => { live = false; };
  }, [fingerprint, profile?.demo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) return; setStep(0); const t = setInterval(() => setStep(n => Math.min(n + 1, 2)), 2000); return () => clearInterval(t); }, [loading]);
  if (profile === undefined) return null;
  if (!profile) return <div className="mx-auto max-w-xl text-center"><Sprout mood="thinking" size={100} /><h1 className="page-title mt-4">Your plan starts here</h1><Button asChild className="btn-main mt-6"><Link to="/setup">Add your loans <ArrowRight /></Link></Button></div>;
  const result = simulate(profile.loans, now, options);
  const timeline = buildTimeline(profile, now, options);
  const visible = expanded ? timeline : timeline.filter(row => row.current || row.milestones.length > 0);
  const monthly = profile.loans.reduce((s,l) => s+l.payment, 0) + (options.extra ?? 0);

  const generate = async () => {
    if (loading || terminal) return;
    const controller = new AbortController(); abort.current = controller;
    const previous = ideas;
    setLoading(true); setError(""); setLimited(false); setIdeas([]); setNote(false);
    const timer = setTimeout(() => setError("Still working on your ideas. You can wait or stop and try again."), 15000);
    try {
      const {data: {session}} = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in to find your personal ideas.");
      const requestCacheKey = `clearday-ideas:${session.user.id}`;
      const response = await fetch("/api/advice", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: fingerprint, signal: controller.signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 429) { let saved = previous; try { const c = JSON.parse(localStorage.getItem(requestCacheKey) ?? "null"); if (!saved.length && Array.isArray(c?.ideas)) saved = safeIdeas({ ideas: c.ideas }); } catch { /* ignore */ } setIdeas(saved); setLimited(true); return; }
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
          if (event.type === "result") { const fresh = safeIdeas({ ideas: event.ideas }); const n = event.note === true; setIdeas(fresh); setNote(n); setError(""); received = true; if (fresh.length) localStorage.setItem(requestCacheKey, JSON.stringify({ fingerprint, ideas: fresh, note: n })); }
        }
        if (chunk.done) break;
      }
      if (!received) throw new Error("No suggestions were returned. Start a fresh request when you're ready.");
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "timeout");
    }
    finally { clearTimeout(timer); if (abort.current === controller) setLoading(false); }
  };

  autoRun.current = generate;
  return <div className="mx-auto max-w-6xl space-y-7">
    <header><h1 className="page-title">Ideas from Sprout</h1><p className="page-sub mt-1">One month at a time. Every little step counts.</p></header>
      <section aria-label="Ideas for you" className="min-w-0">
        <div className="flex items-center gap-2"><Sparkles className="size-5 text-tip" /><h2 className="font-heading text-xl font-semibold">A little extra, your way</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">{jobLabel ? `Small possibilities for you as a ${jobLabel.toLowerCase()}.` : "Small possibilities that fit your budget."}</p>
        {limited && !loading && <div className="leaf mt-6 flex items-center gap-4 bg-chip-purple p-5 text-chip-purple-text" role="status"><Sprout mood="calm" size={72} /><p className="font-heading text-lg font-semibold">You've got fresh ideas for today. Come back tomorrow for more.</p></div>}
        {(loading || (ideas.length === 0 && !error && !limited)) && <div className="mt-6" role="status" aria-live="polite">
          <div className="leaf flex items-center gap-4 bg-chip-purple p-5 text-chip-purple-text"><span className="sprout-think-bob shrink-0"><Sprout mood="thinking" size={76} /></span><p key={step} className="idea-in min-w-0 flex-1 font-heading text-lg font-semibold">{["Looking at your loans...", jobLabel ? `Thinking about ideas for ${/^[aeiou]/i.test(jobLabel) ? "an" : "a"} ${jobLabel.toLowerCase()}...` : "Thinking about ideas for you...", "Almost ready..."][step]}</p>{loading && <Button variant="ghost" size="icon" aria-label="Stop suggestions" onClick={() => { abort.current?.abort(); setLoading(false); setError("Stopped. Start again whenever you like."); }}><Square /></Button>}</div>
          <div className="mt-5 grid gap-4" aria-hidden="true">{[0,1,2].map(i => <div key={i} className="leaf border bg-card p-5"><div className="idea-shimmer h-3 w-24 rounded-full" /><div className="idea-shimmer mt-4 h-5 w-3/4 rounded-full" /><div className="idea-shimmer mt-3 h-3 w-full rounded-full" /><div className="idea-shimmer mt-2 h-3 w-5/6 rounded-full" /><div className="idea-shimmer mt-5 h-10 w-full rounded-full" /></div>)}</div>
        </div>}
        {error && loading && <p className="mt-3 text-sm text-muted-foreground" role="status">{error}</p>}
        {error && !loading && <div className="leaf mt-6 flex flex-col items-center gap-3 border bg-card p-6 text-center" role="alert"><Sprout mood="calm" size={80} /><p className="font-heading text-lg font-semibold">{error === "timeout" || !terminal ? "That took too long. Try again?" : error}</p>{error !== "timeout" && !terminal && error.length > 0 && <p className="text-sm text-muted-foreground">{error}</p>}{!terminal && <Button className="btn-main" onClick={generate}>Try again</Button>}</div>}
        {note && ideas.length > 0 && !loading && <p className="mt-5 text-sm text-muted-foreground"><Link to="/settings" className="font-semibold text-green-text underline-offset-2 hover:underline">Add your job in Settings</Link> for ideas made for you.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ideas.map((idea,i) => {
          const impact = ideaImpact(profile.loans, options, idea.monthlyAmount, now);
          return <article key={`${idea.title}-${i}`} style={{ animationDelay: `${i * 150}ms` }} className="idea-in leaf bg-chip-purple p-5 text-chip-purple-text">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase">{idea.kind === "earn" ? "Earn a little" : "Save a little"}</span><Sparkles className="size-4" /></div>
            {idea.tag && <span className="mt-3 inline-flex rounded-full bg-card px-3 py-1 text-xs font-bold text-chip-purple-text">{idea.tag}</span>}
            <h3 className="font-heading mt-3 text-lg font-semibold">{idea.title}</h3><p className="mt-2 text-sm leading-relaxed">{idea.detail}</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"><p className="font-heading text-2xl font-bold text-foreground">~{usd(idea.monthlyAmount)}<span className="text-sm font-normal"> / month</span></p><span className="text-sm font-semibold">{impact.monthsSooner === null ? impact.nextDate ? `Debt free ${formatMonth(impact.nextDate)}` : "Explore your new date" : impact.monthsSooner > 0 ? `${impact.monthsSooner} ${impact.monthsSooner === 1 ? "month" : "months"} sooner` : "Less interest, same month"}</span></div>
            <Button variant="outline" className="btn-secondary mt-4 w-full" onClick={() => setSelectedIdea(idea)}>Try this <ArrowRight /></Button>
          </article>;
        })}</div>
        {ideas.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Amounts are estimates, not guaranteed. Each idea is compared separately with your chosen plan.</p>}
        {ideas.length > 0 && !loading && !profile.demo && <Button variant="link" onClick={generate} className="mt-3 h-auto p-0 text-green-text">Get new ideas</Button>}
        <p className="mt-6 text-xs text-muted-foreground">Powered by Lovable AI</p>
      </section>
    <div className="flex flex-wrap items-center justify-between gap-5 border-y py-6">
      <div><p className="text-sm text-muted-foreground">Your debt free day</p><p className="font-heading mt-1 text-4xl font-bold">{result.debtFreeDate ? formatMonth(result.debtFreeDate) : "Let's adjust your payments"}</p></div>
      <div className="flex items-center gap-5"><div className="text-right"><p className="font-heading text-2xl font-semibold">{usd(monthly)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p><span className="chip-green mt-2">{percentPaid(profile.loans)}% paid</span></div><Sprout mood={result.monthsLeft === 0 ? "crowned" : "happy"} size={80} /></div>
    </div>
      <section aria-label="Monthly timeline" className="min-w-0">
        <div className="flex items-center justify-between gap-2"><h2 className="font-heading text-xl font-semibold">Your path to freedom</h2><span className="text-xs text-muted-foreground">{result.monthsLeft ?? "600+"} months to go</span></div>
        <ol className="mt-5">
          {visible.map(row => <li key={row.date.toISOString()} className="relative ml-3 border-l-2 border-border pb-6 pl-7 last:border-transparent">
            <span className={`absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full ${row.milestones.length ? `bg-sun text-ink ${row.current ? "ring-4 ring-green" : "ring-4 ring-chip-yellow"}` : row.current ? "bg-green ring-4 ring-chip-green" : "border-2 border-border bg-background"}`}>{row.milestones.length > 0 && <Check className="size-3" />}</span>
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-heading font-semibold">{formatMonth(row.date)}</h3>{row.current && <span className="chip-green">You are here</span>}</div>
            <p className="mt-1 text-sm text-muted-foreground">{row.past ? row.logged > 0 ? `${usd(row.logged)} logged` : "No payments logged" : row.current ? `${usd(row.totalLeft ?? 0)} left` : `${usd(row.plannedPayment ?? 0)} planned · ${usd(row.totalLeft ?? 0)} left`}</p>
            <div className="mt-2 flex flex-wrap gap-2">{row.milestones.map(label => <span key={label} className="chip-yellow max-w-full"><Flag className="size-3 shrink-0 fill-sun text-sun" /><span className="min-w-0 break-words">{label}{row.current && label !== "Debt free" ? " reached" : ""}</span></span>)}</div>
          </li>)}
        </ol>
        <Button variant="link" className="h-auto p-0 text-green-text" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp /> : <ChevronDown />}{expanded ? "Show key moments" : `Show every month (${timeline.length})`}</Button>
        <p className="mt-3 text-xs text-muted-foreground">Future dates are estimates. Past months show your logged payments; milestones already reached appear at today’s marker.</p>
      </section>

    {selectedIdea && <IdeaPreview idea={selectedIdea} profile={profile} now={now} onClose={() => setSelectedIdea(null)} />}
    <footer className="border-t py-5 text-center text-xs text-muted-foreground">Clearday is a planning tool, not financial advice.</footer>
  </div>;
}
