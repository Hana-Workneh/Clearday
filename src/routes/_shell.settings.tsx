import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, LogOut, Sun, Moon, Save } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { LoanMenu } from "@/components/LoanMenu";
import { useProfile, useAccount, saveProfile, clearAccount } from "@/lib/store";
import { currencies, money, type Currency } from "@/lib/account-data";
import { deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout } from "@/components/Sprout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Loan } from "@/lib/debt";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({ meta: [
    { title: "Settings · Clearday" },
    { name: "description", content: "Change your currency, theme and other preferences." },
    { property: "og:title", content: "Settings · Clearday" },
    { property: "og:description", content: "Change your currency, theme and other preferences." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Settings,
});

const field = "leaf w-full border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";
function Settings() {
  const profile = useProfile(); const account = useAccount(); const navigate = useNavigate(); const router = useRouter(); const removeAccount = useServerFn(deleteAccount);
  const [name, setName] = useState(""); const [income, setIncome] = useState(""); const [job, setJob] = useState(""); const [currency, setCurrency] = useState<Currency>("USD"); const [theme, setTheme] = useState<"light" | "dark">("light");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [editing, setEditing] = useState<Loan | null>(null); const [deleting, setDeleting] = useState<Loan | null>(null); const [deleteAll, setDeleteAll] = useState(false);
  useEffect(() => { if (profile) { setName(profile.name); setIncome(String(profile.income)); setJob(profile.job); setCurrency(profile.currency ?? "USD"); setTheme(profile.theme ?? (document.documentElement.classList.contains("dark") ? "dark" : "light")); } }, [profile]);
  if (profile === undefined) return null;
  if (!profile) return <div className="mx-auto max-w-xl py-12 text-center"><Sprout mood="waving" size={100} /><h1 className="page-title mt-4">Make Clearday yours</h1><Button asChild className="btn-main mt-6"><Link to={account.id ? "/setup" : "/auth"}>{account.id ? "Add my details" : "Continue with Google"}</Link></Button></div>;
  const persist = async (next: typeof profile) => { setBusy(true); setMessage(""); try { await saveProfile(next); setMessage("Saved!"); return true; } catch (e) { setMessage(e instanceof Error ? e.message : "Your changes couldn't save. Please try again."); return false; } finally { setBusy(false); } };
  const signOut = async () => { await router.options.context.queryClient.cancelQueries(); router.options.context.queryClient.clear(); const {error} = await supabase.auth.signOut(); if (error) throw error; clearAccount(); await navigate({to: "/auth", replace: true}); };
  const saveDetails = async (e: React.FormEvent) => { e.preventDefault(); if (await persist({...profile, name: name.trim(), income: Number(income), job: job.trim(), currency, theme})) { localStorage.setItem("clearday-theme", theme); document.documentElement.classList.toggle("dark", theme === "dark"); } };
  return <div className="mx-auto max-w-4xl space-y-8">
    <header><h1 className="page-title">Settings</h1><p className="page-sub mt-1">A little more you.</p></header>
    <section className="border-y py-6"><h2 className="font-heading text-xl font-semibold">Your details</h2><form onSubmit={saveDetails} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold">Name<input className={field} value={name} onChange={e => setName(e.target.value)} required maxLength={100} /></label>
      <label className="grid gap-2 text-sm font-semibold">Monthly income ({currency})<input className={field} type="number" min="0.01" step="0.01" value={income} onChange={e => setIncome(e.target.value)} required /></label>
      <label className="grid gap-2 text-sm font-semibold">Job title<input className={field} value={job} onChange={e => setJob(e.target.value)} maxLength={160} /></label>
      <label className="grid gap-2 text-sm font-semibold">Currency<select className={field} value={currency} onChange={e => setCurrency(e.target.value as Currency)}>{currencies.map(c => <option key={c}>{c}</option>)}</select></label>
      <div className="sm:col-span-2"><p className="mb-2 text-sm font-semibold">Appearance</p><div className="flex gap-2">{(["light", "dark"] as const).map(t => <Button key={t} type="button" variant="outline" aria-pressed={theme === t} className={`btn-secondary !h-11 ${theme === t ? "border-foreground bg-secondary" : ""}`} onClick={() => setTheme(t)}>{t === "light" ? <Sun /> : <Moon />}{t === "light" ? "Light" : "Dark"}</Button>)}</div></div>
      <p className="text-xs text-muted-foreground sm:col-span-2">Changing currency changes money labels, not the amounts or exchange rates.</p><Button className="btn-main w-fit" disabled={busy}><Save />Save changes</Button>
    </form></section>
    <section><div className="flex items-center justify-between"><h2 className="font-heading text-xl font-semibold">Your loans</h2><Button asChild variant="ghost"><Link to="/setup"><Plus />Add loan</Link></Button></div><ul className="mt-3 divide-y">{profile.loans.map(l => <li key={l.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words font-semibold">{l.name}</p><p className="text-sm text-muted-foreground">{money(l.balance, profile.currency)} left · {l.rate}% · {money(l.payment, profile.currency)}/month</p></div><LoanMenu loan={l} onEdit={() => setEditing({...l})} /></li>)}</ul></section>
    <section className="border-t py-6"><h2 className="font-heading text-xl font-semibold">Your account</h2><p className="mt-1 text-sm text-muted-foreground">Your loan data is private to your account. We never sell it, and you can delete everything anytime in Settings.</p>{account.id && !profile.demo ? <div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" className="btn-secondary" disabled={busy} onClick={() => { void signOut().catch(() => setMessage("Sign-out couldn't finish. Please try again.")); }}><LogOut />Sign out</Button><Button variant="outline" className="btn-secondary" onClick={() => setDeleteAll(true)}><Trash2 />Delete my account and data</Button></div> : <Button asChild className="btn-main mt-4"><Link to="/auth">Continue with Google</Link></Button>}</section>
    {message && <p role="status" className="text-sm text-tip">{message}</p>}
    <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}><DialogContent className="leaf bg-card"><DialogHeader><DialogTitle>Edit loan</DialogTitle><DialogDescription>Keep your numbers up to date.</DialogDescription></DialogHeader>{editing && <form className="grid gap-4" onSubmit={async e => { e.preventDefault(); if (await persist({...profile, loans: profile.loans.map(l => l.id === editing.id ? {...editing, startBalance: Math.max(editing.startBalance, editing.balance)} : l)})) setEditing(null); }}><label className="grid gap-2 text-sm font-semibold">Loan name<input className={field} value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} required /></label>{(["balance", "rate", "payment"] as const).map(k => <label key={k} className="grid gap-2 text-sm font-semibold">{k === "balance" ? `Amount left (${currency})` : k === "rate" ? "Yearly interest (%)" : `Monthly payment (${currency})`}<input type="number" className={field} value={editing[k]} min={k === "payment" ? "0.01" : "0"} step="0.01" required onChange={e => setEditing({...editing, [k]: Number(e.target.value)})} /></label>)}<Button className="btn-main" disabled={busy}>Save loan</Button></form>}</DialogContent></Dialog>
    <Dialog open={!!deleting || deleteAll} onOpenChange={o => { if (!o) { setDeleting(null); setDeleteAll(false); } }}><DialogContent className="leaf bg-card"><DialogHeader><DialogTitle>{deleteAll ? "Delete your account?" : `Delete ${deleting?.name ?? "this loan"}?`}</DialogTitle><DialogDescription>{deleteAll ? "Your profile, loans, plan and payment history will be permanently deleted. This cannot be undone." : "This loan and its payment history will be removed. This cannot be undone."}</DialogDescription></DialogHeader><div className="flex flex-wrap gap-3"><Button variant="outline" className="btn-secondary" onClick={() => {setDeleting(null); setDeleteAll(false);}}>Keep it</Button><Button className="btn-main" disabled={busy} onClick={async () => { if (deleteAll) { setBusy(true); try { await removeAccount(); await signOut(); } catch { setMessage("Your account couldn't be deleted. Please try again."); } finally { setBusy(false); } } else if (deleting && await persist({...profile, loans: profile.loans.filter(l => l.id !== deleting.id), payments: profile.payments?.filter(p => p.loanId !== deleting.id)})) setDeleting(null); }}><Trash2 />{deleteAll ? "Delete everything" : "Delete loan"}</Button></div></DialogContent></Dialog>
  </div>;
}
