import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { saveProfile, demoProfile } from "@/lib/store";
import { PlusCircle, CalendarHeart, Rocket } from "lucide-react";
import { Sprout } from "@/components/Sprout";
import { ThemeToggle } from "@/components/ThemeToggle";

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

const steps = [
  { icon: PlusCircle, title: "Add your loans", text: "Just the basics: how much, the rate, and your monthly payment." },
  { icon: CalendarHeart, title: "See your date", text: "We show you the exact month you'll be free." },
  { icon: Rocket, title: "Pay it off faster", text: "Get friendly tips to bring that day closer." },
];

function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <Sprout size={34} />
          <span className="font-heading text-xl font-semibold">Clearday</span>
        </div>
        <ThemeToggle />
      </header>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-8 text-center md:pt-14">
        <Sprout mood="waving" size={150} />
        <p className="mt-4 text-sm font-semibold text-green-text">See the day you'll be free.</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">Debt feels endless. It doesn't have to.</h1>
        <p className="mt-5 text-lg text-muted-foreground">Add your loans and see the exact month you'll be debt free.</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/setup" className="btn-main">
            Find my debt free date
          </Link>
          <button onClick={() => { saveProfile(demoProfile); navigate({ to: "/home" }); }} className="btn-secondary">
            Try the demo
          </button>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-16 md:py-24">
        <h2 className="text-center text-2xl font-semibold md:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="leaf-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="leaf grid h-10 w-10 place-items-center bg-green/15 text-green-text"><s.icon className="h-5 w-5" /></span>
                <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
