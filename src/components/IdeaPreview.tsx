import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sprout } from "@/components/Sprout";
import { money } from "@/lib/account-data";
import { formatMonth } from "@/lib/debt";
import { extraFromIdea, ideaImpact, planFromIdea, type Idea } from "@/lib/plan";
import { loadProfile, planOptions, saveProfile, type Profile } from "@/lib/store";

export function IdeaPreview({ idea, profile, now, onClose }: { idea: Idea; profile: Profile; now: Date; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const options = planOptions(profile, now);
  const impact = ideaImpact(profile.loans, options, idea.monthlyAmount, now);
  const extra = extraFromIdea(options, idea.monthlyAmount);
  const confirm = async () => {
    setSaving(true); setError("");
    try {
      const current = loadProfile();
      if (!current) throw new Error("Your plan is not available.");
      await saveProfile({ ...current, plan: planFromIdea(current.plan ?? {}, idea.monthlyAmount) });
      setSaved(true);
    } catch { setError("Your plan couldn't save. Please try again."); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="leaf-lg w-[calc(100%-2rem)] max-w-md bg-card">
      <div className="flex justify-center"><Sprout mood={saved ? "cheering" : "thinking"} size={88} /></div>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl leading-snug">{saved ? "Added to your plan!" : idea.title}</DialogTitle>
        <DialogDescription className="pt-2 text-base leading-relaxed">
          {saved ? `Your extra monthly amount is now ${money(extra, profile.currency)}.` : `With ${money(idea.monthlyAmount, profile.currency)} more a month, ${impact.nextDate ? `you'd be debt free in ${formatMonth(impact.nextDate)}${impact.monthsSooner !== null && impact.monthsSooner > 0 ? `, ${impact.monthsSooner} ${impact.monthsSooner === 1 ? "month" : "months"} sooner` : ""}.` : "you'd bring your free day closer."}`}
        </DialogDescription>
      </DialogHeader>
      {!saved && <p className="text-xs text-muted-foreground">{options.extra ? `This adds to your current extra, making ${money(extra, profile.currency)} extra each month. ` : ""}Estimates, not guaranteed. Your loan order stays the same.</p>}
      {error && <p role="alert" className="text-sm text-tip">{error}</p>}
      <div className="grid gap-3">
        <Button className="btn-main w-full" disabled={saving} onClick={saved ? onClose : confirm}>{saved ? <><Check />Done</> : saving ? "Saving…" : "Add to my plan"}</Button>
        <Button asChild variant="outline" className="btn-secondary w-full" disabled={saving}><Link to="/pay-faster" search={{ extra }}>See it in Pay faster <ArrowRight /></Link></Button>
      </div>
    </DialogContent>
  </Dialog>;
}