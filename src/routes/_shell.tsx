import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Zap, Map, TrendingUp, Settings, Plus } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaymentFlow, openPayment } from "@/components/PaymentFlow";
import { useAccount, useProfile, leaveDemo, refreshAccount } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/PageLoading";
import { isDebtFree } from "@/lib/celebration";

export const Route = createFileRoute("/_shell")({ component: Shell });

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/pay-faster", label: "Pay faster", icon: Zap },
  { to: "/plan", label: "My plan", icon: Map },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Shell() {
  const profile = useProfile();
  const account = useAccount();
  const location = useLocation();
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r bg-card p-5 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <Sprout size={36} mood="happy" />
          <span className="font-heading text-xl font-semibold">Clearday</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 rounded-[12px_12px_12px_4px] px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "!bg-chip-green !text-chip-green-text !font-bold" }}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <Button disabled={!!profile && isDebtFree(profile)} onClick={() => openPayment()} className="btn-main mt-auto whitespace-nowrap !px-4 text-sm"><Plus className="h-4 w-4" /> I made a payment</Button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-4 sm:flex sm:justify-between md:justify-end md:px-10">
          <Link to="/" className="flex min-w-0 items-center gap-1.5 md:hidden">
            <Sprout size={30} />
            <span className="truncate font-heading text-lg font-semibold">Clearday</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button disabled={!!profile && isDebtFree(profile)} onClick={() => openPayment()} className="btn-main !h-10 !px-3 text-sm md:hidden">
              <Plus className="h-4 w-4" /> Payment
            </Button>
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to={account.id ? "/settings" : "/auth"}>{account.id ? "My account" : "Sign in"}</Link></Button>
          </div>
        </header>
        <main className="flex-1 px-5 pb-28 md:px-10 md:pb-10">
          {profile?.demo && <div className="mx-auto mb-6 grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-y bg-chip-purple px-3 py-3 text-chip-purple-text sm:flex sm:justify-between"><p className="min-w-0 text-sm font-semibold">You're viewing a demo</p><Button asChild variant="outline" className="btn-secondary !h-10 shrink-0 !px-3 text-sm"><Link to="/auth" onClick={leaveDemo}>Start my own</Link></Button></div>}
          {account.error ? <div role="alert" className="mx-auto max-w-xl py-12 text-center"><Sprout mood="calm" size={90} /><p>{account.error}</p><Button onClick={() => refreshAccount()} className="btn-main mt-5">Reload my account</Button></div> : !account.ready ? <PageLoading /> : <div key={location.pathname} className="page-enter"><Outlet /></div>}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t bg-card px-2 py-2 md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "!text-green-text" }}>
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
      <PaymentFlow />
    </div>
  );
}
