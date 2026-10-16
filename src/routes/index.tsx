import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { startDemo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { WelcomeSections } from "@/components/WelcomeSections";
import { WelcomeNav } from "@/components/WelcomeNav";
import { TryItCalculator } from "@/components/TryItCalculator";

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

function FloatingLeaves() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="float-leaf leaf-lg absolute -left-10 top-24 size-40 bg-green opacity-[0.07]" />
      <span className="float-leaf float-leaf-slow leaf-lg absolute right-[8%] top-16 size-24 bg-tip opacity-[0.08]" />
      <span className="float-leaf float-leaf-fast leaf-lg absolute bottom-10 left-[12%] size-20 bg-sun opacity-[0.10]" />
      <span className="float-leaf float-leaf-slow leaf-lg absolute -right-8 bottom-24 size-32 bg-green opacity-[0.06]" />
    </div>
  );
}

function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" id="top">
      <WelcomeNav />
      <section className="relative mx-auto max-w-5xl px-5 pb-10 pt-28 md:pt-32">
        <FloatingLeaves />
        <div className="relative grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-8">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-green-text">See the day you'll be free.</p>
            <h1 className="mt-3 text-[32px] font-semibold leading-tight sm:text-4xl md:text-6xl">
              <span className="block">Debt feels endless.</span>
              <span className="block">It doesn't have to.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground md:mx-0">Add your loans and see the exact month you'll be debt free.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Button asChild className="btn-main"><Link to="/setup">Find my debt free date</Link></Button>
              <Button variant="outline" onClick={() => { startDemo(); navigate({ to: "/home" }); }} className="btn-secondary">Try the demo</Button>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <TryItCalculator />
          </div>
        </div>
      </section>
      <WelcomeSections />
    </div>
  );
}
