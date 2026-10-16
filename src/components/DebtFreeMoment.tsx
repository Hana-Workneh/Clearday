import { useEffect, useRef, useState } from "react";
import { Download, Flag, Check, Leaf } from "lucide-react";
import { Sprout } from "./Sprout";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { celebrationStats } from "@/lib/celebration";
import { money } from "@/lib/account-data";
import { deliverImage } from "@/lib/download";
import { saveProfile, type Profile } from "@/lib/store";

export function DebtFreeMoment({profile, preview = false}: {profile: Profile; preview?: boolean}) {
  const stats = celebrationStats(profile);
  const card = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState(profile.savingsGoal?.name ?? "Emergency fund");
  const [goalAmount, setGoalAmount] = useState(String(profile.savingsGoal?.amount ?? ""));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    async function prepare() {
      try {
        await document.fonts.ready;
        const {toBlob} = await import("html-to-image");
        if (!card.current || !active) return;
        const blob = await toBlob(card.current, {pixelRatio: 2, cacheBust: false});
        if (active && blob) setImage(blob);
      } catch { if (active) setError("Your card couldn't load. Please refresh to try again."); }
    }
    void prepare(); return () => { active = false; };
  }, [profile.name]);
  return <div className="mx-auto max-w-4xl pb-8 text-center page-enter">
    <div className="flex justify-center"><Sprout mood="crowned" size={160} /></div>
    {preview && <p className="chip-purple mt-2">A preview of your free day</p>}
    <h1 className="mt-5 font-heading text-3xl font-semibold leading-tight sm:text-5xl">You did it, {profile.name}!<br />You're debt free.</h1>
    <p className="mt-4 text-muted-foreground">Every little payment brought you here. This moment is yours.</p>
    <div className="my-8 grid grid-cols-3 gap-2 border-y py-6 sm:gap-6">
      {[{value: stats.loansPaid, label: "Loans paid off"}, {value: money(stats.totalPaid, profile.currency), label: "Total paid", note: "From logged payments"}, {value: stats.monthsEarlier ?? "—", label: "Months earlier", note: "Than your first plan"}].map(s => <div key={s.label} className="min-w-0"><p className="break-words font-heading text-2xl font-bold sm:text-4xl">{s.value}</p><p className="mt-2 text-sm font-semibold">{s.label}</p>{s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}</div>)}
    </div>
    <div ref={card} className="share-leaf mx-auto flex aspect-[5/4] w-full max-w-md flex-col items-center justify-center bg-green p-7 text-ink">
      <div className="flex items-center gap-2 font-heading text-sm font-semibold"><Leaf className="h-4 w-4" />Clearday</div>
      <div className="my-4"><Sprout mood="crowned" size={104} className="share-sprout" /></div>
      <p className="font-heading text-3xl font-bold">{profile.name}'s free day</p>
      <p className="mt-2 font-heading text-xl font-semibold">{stats.date.toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric"})}</p>
      <p className="mt-5 text-sm font-semibold">Debt free. A new chapter begins.</p>
    </div>
    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button className="btn-main" disabled={!image} onClick={() => { if (image) void deliverImage(image, "my-clearday.png").catch(() => setError("Your image couldn't download. Please try again.")); }}><Download />{image ? "Share my card" : "Preparing your card…"}</Button><Button variant="outline" className="btn-secondary" onClick={() => setGoalOpen(true)}><Flag />Set a new goal</Button></div>
    {profile.savingsGoal && !preview && <p className="mt-5 text-green-text">Next chapter: {profile.savingsGoal.name} · {money(profile.savingsGoal.amount, profile.currency)}</p>}
    {error && <p role="alert" className="mt-4 text-tip">{error}</p>}
    <Dialog open={goalOpen} onOpenChange={setGoalOpen}><DialogContent className="leaf bg-card"><DialogHeader><DialogTitle>Your next chapter</DialogTitle><DialogDescription>{preview ? "Try a goal here. Your saved progress stays the same." : "What would you love to save for next?"}</DialogDescription></DialogHeader>{saved ? <div role="status" className="py-6 text-center"><Sprout mood="happy" size={90} /><h2 className="mt-3 text-xl font-semibold">A fresh start: {goalName}</h2><p className="mt-2 text-muted-foreground">{money(Number(goalAmount), profile.currency)} to look forward to.</p><Button className="btn-main mt-5" onClick={() => setGoalOpen(false)}><Check />Done</Button></div> : <form className="grid gap-4" onSubmit={async e => { e.preventDefault(); setBusy(true); try { if (!preview) await saveProfile({...profile, savingsGoal: {name: goalName.trim(), amount: Number(goalAmount)}}); setSaved(true); } catch { setError("Your goal couldn't save. Please try again."); } finally { setBusy(false); } }}><label className="grid gap-2 text-sm font-semibold">My goal<input required maxLength={100} className="leaf border bg-background px-4 py-3" value={goalName} onChange={e => setGoalName(e.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Target ({profile.currency ?? "USD"})<input required type="number" min="0.01" step="0.01" className="leaf border bg-background px-4 py-3" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} /></label><Button disabled={busy} className="btn-main"><Flag />{busy ? "Saving…" : "Save my goal"}</Button></form>}</DialogContent></Dialog>
  </div>;
}