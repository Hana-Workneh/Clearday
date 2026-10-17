import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PlusCircle, CalendarHeart, Rocket, ArrowUpRight, Quote, CloudRain, Sunrise } from "lucide-react";
import { Sprout } from "./Sprout";
import { Stone } from "./Stone";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { scrollToSection } from "./WelcomeNav";
import { SeeItInAction } from "./SeeItInAction";

const steps = [
  { icon: PlusCircle, title: "Add your loans", text: "A few numbers. A clearer picture.", accent: "bg-chip-green text-chip-green-text", preview: "bg-chip-green" },
  { icon: CalendarHeart, title: "See your date", text: "An end in sight. A day to look forward to.", accent: "bg-chip-purple text-chip-purple-text", preview: "bg-chip-purple" },
  { icon: Rocket, title: "Pay it off faster", text: "Little changes. A closer free day.", accent: "bg-chip-yellow text-chip-yellow-text", preview: "bg-chip-yellow" },
];
const facts = [
  { value: 32, suffix: "%", text: "Kenyan adults who borrowed through mobile money", source: "World Bank Global Findex 2025", href: "https://www.citizen.digital/business/bank-borrowing-in-kenya-shrinks-as-many-opt-for-mobile-money-loans-world-bank-n366707", note: "2024 borrowing data" },
  { value: 8, suffix: "M+", text: "Digital borrowers every month in Kenya", source: "Digital Financial Services Association of Kenya", href: "https://www.citizen.digital/business/kenyans-borrowing-ksh-500m-daily-from-digital-lenders-report-n359881", note: "2025 industry estimate" },
  { value: 65, suffix: "%", text: "US millennials with debt who don't know when they'll pay it off or think they never will", source: "CreditCards.com survey, 2017", href: "https://www.nasdaq.com/articles/poll-2-3-us-adults-debt-doubt-theyll-ever-live-debt-free-2018-01-10", note: "Survey fielded December 2017" },
] as const;

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "reveal-in" : ""} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 900);
          setN(Math.round(value * (1 - Math.pow(1 - t, 3))));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

export function WelcomeSections() {
  const [extra, setExtra] = useState(50);
  return (
    <>
      <section id="the-numbers" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-12 md:py-16" aria-labelledby="facts-title">
        <Reveal className="mb-8 max-w-2xl">
          <p className="text-xs font-bold text-green-text">WHY THIS MATTERS</p>
          <h2 id="facts-title" className="mt-3 text-balance text-3xl font-semibold leading-tight">Borrowing takes a minute. Paying it back can take years.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">From Nairobi to New York, people borrow easily but can't see the end.</p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {facts.map((fact, index) => (
            <Reveal key={fact.suffix + fact.value} delay={index * 120}>
              <article className="leaf-lg flex h-full flex-col border bg-card p-6">
                <p className="font-heading text-6xl font-bold leading-none whitespace-nowrap text-stat-purple"><CountUp value={fact.value} suffix={fact.suffix} /></p>
                <p className="mb-6 mt-4 text-sm leading-relaxed">{fact.text}</p>
                <a className="mt-auto flex items-start gap-2 text-xs leading-relaxed text-muted-foreground underline-offset-4 hover:underline" href={fact.href} target="_blank" rel="noreferrer">{fact.source}<ArrowUpRight className="mt-0.5 size-3 shrink-0" /></a>
                <p className="mt-1 text-[11px] text-muted-foreground">{fact.note}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8">
          <div className="flex justify-end pr-5 -mb-3" aria-hidden="true"><Sprout mood="calm" size={76} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[{ quote: "Little did I know what I had got into.", source: "Borrower, Nation Africa" }, { quote: "There's no light at the end of this tunnel.", source: "Borrower, Reddit r/StudentLoans" }].map((q) => (
              <figure key={q.source} className="leaf border bg-card p-5">
                <Quote className="mb-3 size-5 text-muted-foreground/50" />
                <blockquote className="text-base italic leading-relaxed">“{q.quote}”</blockquote>
                <figcaption className="mt-3 text-xs text-muted-foreground">{q.source}</figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="two-feelings" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-12 md:py-16" aria-labelledby="feelings-title">
        <Reveal className="mb-8 text-center">
          <h2 id="feelings-title" className="text-3xl font-semibold">The same debt, two different feelings</h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <article className="leaf-lg flex h-full flex-col border bg-card p-6 md:p-7">
              <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground"><CloudRain className="size-5" /></span><Stone size={100} /></div>
              <h3 className="mt-4 font-heading text-xl font-semibold">Without a plan</h3>
              <p className="mt-2 text-balance text-2xl font-heading font-semibold text-muted-foreground">“I owe $4,000… someday it’ll be gone.”</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A heavy number with no end. It sits in the back of your mind, and it's easier not to look at it.</p>
            </article>
          </Reveal>
          <Reveal delay={120}>
            <article className="leaf-lg flex h-full flex-col border-2 border-green bg-card p-6 md:p-7">
              <div className="flex min-h-[100px] items-center justify-between"><span className="grid size-11 place-items-center rounded-full bg-chip-green text-chip-green-text"><Sunrise className="size-5" /></span><Stone size={32} pebble /></div>
              <h3 className="mt-4 font-heading text-xl font-semibold">With Clearday</h3>
              <p className="mt-2 text-balance text-2xl font-heading font-semibold">“I’ll be debt free in June 2029.”</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A day to look forward to. Every payment moves it closer, and you can see it happen.</p>
            </article>
          </Reveal>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-24 px-5 pb-14 pt-14 md:pb-20 md:pt-16" aria-labelledby="how-title">
        <Reveal className="mb-8 text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">A little clarity goes a long way</p>
          <h2 id="how-title" className="mt-2 text-3xl font-semibold">How it works</h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3 md:gap-5">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 120}>
              <article className="welcome-step leaf-lg relative flex h-full min-w-0 flex-col border bg-card p-5 md:p-6">
                {index === 2 && <div className="sprout-peek" aria-hidden="true"><Sprout mood="waving" size={72} /></div>}
                <div className="flex items-center justify-between">
                  <span className="font-heading text-5xl font-semibold text-muted-foreground/45">0{index + 1}</span>
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full ${step.accent}`}><step.icon className="size-5" /></span>
                </div>
                <h3 className="mt-3 font-heading text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                <div className={`leaf mt-5 flex min-h-28 flex-col justify-center p-4 md:mt-6 ${step.preview}`}>
                  {index === 0 && <><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs"><span className="font-semibold">Your loans</span><span className="text-muted-foreground">$4,000 left</span></div><div className="mt-3 h-2 rounded-full bg-card"><div className="h-full w-[8%] rounded-full bg-green" /></div></>}
                  {index === 1 && <div className="rounded-full bg-card px-4 py-3 text-center"><p className="text-xs text-muted-foreground">Debt free by</p><p className="mt-1 font-heading text-lg font-semibold">June 2029</p></div>}
                  {index === 2 && <><Slider min={0} max={100} step={5} value={[extra]} onValueChange={(v) => setExtra(v[0] ?? 50)} aria-label="Try a little extra" /><span className="chip-green mt-4 self-center">{Math.round((extra * 7) / 50)} months sooner</span></>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <SeeItInAction />

      <section id="why-clearday" className="scroll-mt-24 border-y bg-card" aria-labelledby="why-title">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
          <Reveal>
            <p className="text-xs font-bold uppercase text-green-text">Why Clearday</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_2fr] md:gap-12">
              <h2 id="why-title" className="font-heading text-3xl font-semibold leading-tight">Why I built<br className="hidden md:block" /> Clearday</h2>
              <div>
                <p className="text-base leading-relaxed text-muted-foreground">I worked as a product owner in fintech, on payment and remittance systems. I saw how easy it is to borrow and how hard it is to see the way out. Most people I know can't tell you the month their debt will end. When debt feels endless, people stop looking at it. So I built Clearday to turn a scary number into a date, and a plan to reach it sooner.</p>
                <p className="mt-5 font-heading font-semibold">— Hana, founder</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="band-green" aria-labelledby="end-title">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center md:py-20">
          <span className="band-sprout"><Sprout mood="cheering" size={110} /></span>
          <h2 id="end-title" className="mt-5 font-heading text-3xl font-bold leading-tight md:text-4xl">Your debt free day is waiting.</h2>
          <p className="mt-3 max-w-md text-base font-medium opacity-80">Add your loans, see your date, and start moving it closer. It takes two minutes.</p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild className="band-btn"><Link to="/setup">Find my debt free date</Link></Button>
            <Button variant="ghost" onClick={() => scrollToSection("how-it-works")} className="band-btn-ghost">See how it works</Button>
          </div>
        </div>
      </section>

      <footer className="border-t px-5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground">Clearday is a planning tool, not financial advice.</p>
          <p className="text-xs text-muted-foreground">Your loan data is private to your account. We never sell it, and you can delete everything anytime in Settings.</p>
          <p className="text-xs text-muted-foreground">Built by Hana for Lovable SheBuilds 2026.</p>
        </div>
      </footer>
    </>
  );
}
