import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Home, Zap, Map, TrendingUp, Settings, Plus } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaymentFlow, openPayment } from "@/components/PaymentFlow";

export const Route = createFileRoute("/_shell")({ component: Shell });

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/pay-faster", label: "Pay faster", icon: Zap },
  { to: "/plan", label: "My plan", icon: Map },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Shell() {
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
        <button onClick={() => openPayment()} className="btn-main mt-auto whitespace-nowrap !px-4 text-sm">
          <Plus className="h-4 w-4" /> I made a payment
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-4 md:justify-end md:px-10">
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <Sprout size={30} />
            <span className="font-heading text-lg font-semibold">Clearday</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => openPayment()} className="btn-main !h-10 !px-4 text-sm md:hidden">
              <Plus className="h-4 w-4" /> Payment
            </button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-5 pb-28 md:px-10 md:pb-10">
          <Outlet />
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
