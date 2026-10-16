import { useState } from "react";
import { PlusCircle, CalendarHeart, Rocket, ArrowUpRight, Quote } from "lucide-react";
import { Sprout } from "./Sprout";
import { Slider } from "./ui/slider";

const steps = [
  { icon: PlusCircle, title: "Add your loans", text: "A few numbers. A clearer picture.", accent: "bg-chip-green text-chip-green-text", preview: "bg-chip-green" },
  { icon: CalendarHeart, title: "See your date", text: "An end in sight. A day to look forward to.", accent: "bg-chip-purple text-chip-purple-text", preview: "bg-chip-purple" },
  { icon: Rocket, title: "Pay it off faster", text: "Little changes. A closer free day.", accent: "bg-chip-yellow text-chip-yellow-text", preview: "bg-chip-yellow" },
];
const facts = [
  {number: "32%", text: "Kenyan adults who borrowed through mobile money", source: "World Bank Global Findex 2025", href: "https://www.citizen.digital/business/bank-borrowing-in-kenya-shrinks-as-many-opt-for-mobile-money-loans-world-bank-n366707", note: "2024 borrowing data"},
  {number: "8M+", text: "Digital borrowers every month in Kenya", source: "Digital Financial Services Association of Kenya", href: "https://www.citizen.digital/business/kenyans-borrowing-ksh-500m-daily-from-digital-lenders-report-n359881", note: "2025 industry estimate"},
  {number: "65%", text: "US millennials with debt who don't know when they'll pay it off or think they never will", source: "CreditCards.com survey, 2017", href: "https://www.nasdaq.com/articles/poll-2-3-us-adults-debt-doubt-theyll-ever-live-debt-free-2018-01-10", note: "Survey fielded December 2017"},
];

export function WelcomeSections() {
  const [extra, setExtra] = useState(50);
  return <>
    <section className="mx-auto max-w-5xl px-5 pb-14 pt-14 md:pb-20 md:pt-16" aria-labelledby="how-title">
      <div className="mb-8 text-center"><p className="text-xs font-bold uppercase text-muted-foreground">A little clarity goes a long way</p><h2 id="how-title" className="mt-2 text-3xl font-semibold">How it works</h2></div>
      <div className="grid gap-5 md:grid-cols-3 md:gap-5">
        {steps.map((step, index) => <article key={step.title} className="welcome-step leaf-lg relative flex min-w-0 flex-col border bg-card p-5 md:p-6">
          {index === 2 && <div className="pointer-events-none absolute -top-10 right-5"><Sprout mood="happy" size={66} /></div>}
          <div className="flex items-center justify-between"><span className="font-heading text-5xl font-semibold text-muted-foreground/45">0{index + 1}</span><span className={`grid size-11 shrink-0 place-items-center rounded-full ${step.accent}`}><step.icon className="size-5" /></span></div>
          <h3 className="mt-3 font-heading text-xl font-semibold">{step.title}</h3><p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
          <div className={`leaf mt-5 flex min-h-28 flex-col justify-center p-4 md:mt-6 ${step.preview}`}>
            {index === 0 && <><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs"><span className="font-semibold">Phone loan</span><span className="text-muted-foreground">$420 left</span></div><div className="mt-3 h-2 rounded-full bg-card"><div className="h-full w-2/5 rounded-full bg-green" /></div></>}
            {index === 1 && <div className="rounded-full bg-card px-4 py-3 text-center"><p className="text-xs text-muted-foreground">Debt free by</p><p className="mt-1 font-heading text-lg font-semibold">June 2029</p></div>}
            {index === 2 && <><Slider min={0} max={100} step={5} value={[extra]} onValueChange={v => setExtra(v[0] ?? 50)} aria-label="Try a little extra" /><span className="chip-green mt-4 self-center">{Math.round(extra * 7 / 50)} months sooner</span></>}
          </div>
        </article>)}
      </div>
    </section>
    <section className="border-y bg-card" aria-labelledby="why-title"><div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <p className="text-xs font-bold uppercase text-green-text">Why Clearday</p>
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_2fr] md:gap-12"><h2 id="why-title" className="font-heading text-3xl font-semibold leading-tight">Why I built<br className="hidden md:block" /> Clearday</h2><div><p className="text-base leading-relaxed text-muted-foreground">I worked as a product owner in fintech, on payment and remittance systems. I saw how easy it is to borrow and how hard it is to see the way out. Most people I know can't tell you the month their debt will end. When debt feels endless, people stop looking at it. So I built Clearday to turn a scary number into a date, and a plan to reach it sooner.</p><p className="mt-5 font-heading font-semibold">— Hana, founder</p></div></div>
    </div></section>
    <section className="mx-auto max-w-5xl px-5 py-12 md:py-16" aria-labelledby="facts-title">
      <div className="mb-8 max-w-xl"><p className="text-xs font-bold text-green-text">WHY THIS MATTERS</p><h2 id="facts-title" className="mt-3 text-3xl font-semibold leading-tight">Debt is easy to get into and hard to see out of.</h2></div>
      <div className="grid gap-4 md:grid-cols-3">{facts.map(fact => <article key={fact.number} className="leaf-lg flex flex-col border bg-card p-6"><p className="font-heading text-5xl font-bold">{fact.number}</p><p className="mb-6 mt-4 text-sm leading-relaxed">{fact.text}</p><a className="mt-auto flex items-start gap-2 text-xs leading-relaxed text-muted-foreground underline-offset-4 hover:underline" href={fact.href} target="_blank" rel="noreferrer">{fact.source}<ArrowUpRight className="mt-0.5 size-3 shrink-0" /></a><p className="mt-1 text-[11px] text-muted-foreground">{fact.note}</p></article>)}</div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">{[{quote: "Little did I know what I had got into.", source: "Borrower, Nation Africa"}, {quote: "There's no light at the end of this tunnel.", source: "Borrower, Reddit r/StudentLoans"}].map(q => <figure key={q.source} className="leaf border bg-card p-5"><Quote className="mb-3 size-5 text-muted-foreground/50" /><blockquote className="text-base italic leading-relaxed">“{q.quote}”</blockquote><figcaption className="mt-3 text-xs text-muted-foreground">{q.source}</figcaption></figure>)}</div>
      <p className="mt-6 text-center text-sm text-muted-foreground">A clearer path starts with knowing where you're going.</p>
    </section>
    <footer className="border-t px-5 py-6 text-center text-xs text-muted-foreground">Clearday is a planning tool, not financial advice.</footer>
  </>;
}