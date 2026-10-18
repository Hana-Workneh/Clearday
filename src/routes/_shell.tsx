import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Zap, Map, TrendingUp, Settings, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaymentFlow, openPayment } from "@/components/PaymentFlow";
import { useAccount, useProfile } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LoadingTrouble, PageLoading } from "@/components/PageLoading";
import { isDebtFree } from "@/lib/celebration";
import { CleardayLogo } from "@/components/CleardayLogo";
import { AskSprout } from "@/components/AskSprout";
import { ProductTour } from "@/components/ProductTour";
import { demoIdentity } from "@/lib/demo-personas";

import { AppEntry } from "@/components/AppEntry";

export const Route = createFileRoute("/_shell")({ component: ShellEntry });
function ShellEntry() { return <AppEntry><Shell /></AppEntry>; }

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
    <div className={`app-shell flex min-h-screen w-full ${profile?.demo && !account.id ? "demo-shell" : ""}`}>
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r bg-card p-5 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <CleardayLogo />
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              data-tour={to === "/pay-faster" ? "faster" : undefined}
              className="flex items-center gap-3 rounded-[12px_12px_12px_4px] px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "!bg-chip-green !text-chip-green-text !font-bold" }}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <Button
          data-tour="payment"
          disabled={!!profile && isDebtFree(profile)}
          onClick={() => openPayment()}
          className="btn-main mt-auto whitespace-nowrap !px-4 text-sm"
        >
          <Plus className="h-4 w-4" /> I made a payment
        </Button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-4 sm:flex sm:justify-between md:justify-end md:px-10 ${location.pathname === "/home" ? "home-top-row" : ""}`}>
          <Link to="/" className="flex min-w-0 items-center gap-1.5 md:hidden">
            <CleardayLogo />
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              disabled={!!profile && isDebtFree(profile)}
              onClick={() => openPayment()}
              className={`btn-main !h-10 !px-3 text-sm md:hidden ${location.pathname === "/home" ? "hidden" : ""}`}
            >
              <Plus className="h-4 w-4" /> Payment
            </Button>
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to={account.id ? "/settings" : "/auth"}>
                {account.id ? "My account" : "Sign in"}
              </Link>
            </Button>
          </div>
        </header>
        <main
          className={`flex-1 px-5 md:px-10 md:pb-10 ${location.pathname === "/home" ? "pb-44" : "pb-28"}`}
        >
          {account.error && !profile?.demo ? (
            <LoadingTrouble />
          ) : !account.ready && !profile?.demo ? (
            <PageLoading />
          ) : (
            <div
              key={`${location.pathname}:${profile?.demo ? demoIdentity(profile) : account.id}`}
              className="page-enter"
            >
              <Outlet />
            </div>
          )}
        </main>
      </div>
      {location.pathname === "/home" && profile && !isDebtFree(profile) && (
        <div className="fixed inset-x-0 bottom-[68px] z-10 bg-background px-5 pb-3 pt-2 md:hidden">
          <Button
            data-tour="payment"
            variant="payment"
            onClick={() => openPayment()}
            className="h-[54px] w-full text-base"
          >
            <Plus className="size-5" />I made a payment
          </Button>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-[68px] justify-around border-t bg-card px-2 py-2 md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            data-tour={to === "/pay-faster" ? "faster" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "!text-green-text" }}
          >
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
      <PaymentFlow key={profile?.demo ? demoIdentity(profile) : account.id} />
      <AskSprout />
      <ProductTour />
    </div>
  );
}
