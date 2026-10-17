import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { startDemo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { WelcomeSections } from "@/components/WelcomeSections";
import { WelcomeNav } from "@/components/WelcomeNav";
import { TryItCalculator } from "@/components/TryItCalculator";
import { WelcomeCharacters } from "@/components/WelcomeCharacters";
import { useMemo, useState } from "react";
import { simulate } from "@/lib/debt";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clearday — See the day you'll be free" },
      {
        name: "description",
        content: "Add your loans and see the exact month you'll be debt free.",
      },
      { property: "og:title", content: "Clearday — See the day you'll be free" },
      {
        property: "og:description",
        content: "Add your loans and see the exact month you'll be debt free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [owe, setOwe] = useState(4000);
  const [pay, setPay] = useState(155);
  const result = useMemo(() => simulate([
    { id: "try", name: "Loan", balance: owe, startBalance: owe, rate: 15, payment: pay },
  ]), [owe, pay]);
  return (
    <div className="min-h-screen" id="top">
      <WelcomeNav />
      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-24 md:pt-28">
        <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative min-w-0 text-center md:text-left">
            <p className="text-sm font-semibold text-green-text lg:absolute lg:-top-7">See the day you'll be free.</p>
            <h1 className="mt-3 text-[30px] font-semibold leading-tight sm:text-[34px] md:text-5xl lg:mt-0">
              <span className="block">Debt feels endless.</span>
              <span className="block">It doesn't have to.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-lg text-muted-foreground md:mx-0">
              Add your loans and see the exact month you'll be debt free.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Button asChild className="btn-main">
                <Link to="/setup">Find my debt free date</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  startDemo();
                  navigate({ to: "/home" });
                }}
                className="btn-secondary"
              >
                Try the demo
              </Button>
            </div>
            <WelcomeCharacters owe={owe} pay={pay} months={result.monthsLeft ?? 600} />
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <TryItCalculator owe={owe} pay={pay} result={result} onOweChange={setOwe} onPayChange={setPay} />
          </div>
        </div>
      </section>
      <WelcomeSections />
    </div>
  );
}
