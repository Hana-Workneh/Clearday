import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { startDemo, useAccount } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { WelcomeSections } from "@/components/WelcomeSections";
import { WelcomeDashboardPreview } from "@/components/WelcomeDashboardPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CleardayLogo } from "@/components/CleardayLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clearday — See the day you'll be free" },
      { name: "description", content: "Add your loans and see the exact month you'll be debt free." },
      { property: "og:title", content: "Clearday — See the day you'll be free" },
      { property: "og:description", content: "Add your loans and see the exact month you'll be debt free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const account = useAccount();
  return (
    <div className="min-h-screen">
      <header className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-5 py-5 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <CleardayLogo />
        </div>
        <div className="flex items-center gap-3"><Button asChild variant="ghost"><Link to={account.id ? "/home" : "/auth"}>{account.id ? "My account" : "Sign in"}</Link></Button><ThemeToggle /></div>
      </header>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-8 text-center md:pt-14">
        <p className="mt-4 text-sm font-semibold text-green-text">See the day you'll be free.</p>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight sm:text-4xl md:text-6xl"><span className="block">Debt feels endless.</span><span className="block">It doesn't have to.</span></h1>
        <p className="mt-5 text-lg text-muted-foreground">Add your loans and see the exact month you'll be debt free.</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild className="btn-main"><Link to="/setup">
            Find my debt free date
          </Link></Button>
          <Button variant="outline" onClick={() => { startDemo(); navigate({ to: "/home" }); }} className="btn-secondary">
            Try the demo
          </Button>
        </div>
        <WelcomeDashboardPreview />
      </section>
      <WelcomeSections />
    </div>
  );
}
