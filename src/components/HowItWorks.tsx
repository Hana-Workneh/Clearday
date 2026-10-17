import { useEffect, useRef, useState } from "react";
import { Sprout as SproutIcon, Star, Sparkles } from "lucide-react";
import { Sprout } from "./Sprout";
import { Stone } from "./Stone";

const steps = [
  { title: "Add your loans", text: "A few numbers. A clearer picture.", label: "STEP ONE", accent: "text-green-text" },
  { title: "See your date", text: "An end in sight. A day to look forward to.", label: "STEP TWO", accent: "text-chip-purple-text" },
  { title: "Pay it off faster", text: "Little changes. A closer free day.", label: "STEP THREE", accent: "how-step-gold" },
] as const;

function JourneyCard({ index }: { index: number }) {
  const ref = useRef<HTMLElement>(null);
  const [played, setPlayed] = useState(false);
  const step = steps[index];
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      timer = setTimeout(() => setPlayed(true), reduced.matches ? 0 : index * 600);
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [index]);
  if (!step) return null;
  return (
    <article ref={ref} className={`how-journey-card leaf-lg border bg-card ${played ? "journey-played" : ""}`} data-step={index + 1}>
      <div className={`how-scene how-scene-${index + 1}`}>
        <div className="how-ground" aria-hidden="true" />
        <div className="how-sprout"><Sprout mood={index === 2 ? "cheering" : "waving"} size={100} /></div>
        {index === 0 && <p className="how-bubble">I'm your $4,000 debt.</p>}
        {index < 2 ? <div className="how-stone"><Stone size={130} /></div> : (
          <>
            <div className="how-crumble" aria-hidden="true"><Stone size={70} /></div>
            <div className="how-pebbles"><Stone size={24} pebble /><Stone size={10} pebble /><Stone size={8} pebble /></div>
            <Sparkles className="how-sparkles text-sun" aria-hidden="true" />
            <Star className="how-star text-sun fill-sun" aria-hidden="true" />
          </>
        )}
        {index > 0 && (
          <div className="how-flag">
            <div className="flag-pole" aria-hidden="true" />
            <div className="flag-banner">
              <p className="how-flag-label">DEBT FREE BY</p>
              <p className="how-flag-date font-heading font-bold">June 2029</p>
            </div>
          </div>
        )}
        <span className={`how-scene-chip ${index === 2 ? "how-win-chip" : ""}`}>
          {index === 0 ? "Phone loan · Personal loan" : index === 1 ? "$860 interest · 19 days of work" : <><Star className="size-3.5 fill-current" aria-hidden="true" />7 months sooner</>}
        </span>
      </div>
      <div className="how-card-copy">
        <div className="flex items-center gap-3">
          <span className="hero-step size-7 shrink-0 text-xs font-bold">{index + 1}</span>
          <p className={`text-[11px] font-bold ${step.accent}`}>{step.label}</p>
        </div>
        <h3 className="mt-4 font-heading text-2xl font-semibold leading-tight">{step.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
      </div>
    </article>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="page-wrap section-pad scroll-mt-24" aria-labelledby="how-title">
      <div className="section-head text-center">
        <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold text-green-text"><SproutIcon className="size-4" aria-hidden="true" />A little clarity goes a long way</p>
        <h2 id="how-title" className="mt-3 text-[30px] font-semibold leading-tight md:text-[44px]">How it works</h2>
        <p className="mt-4 text-base text-muted-foreground">Sprout's journey to the flag, in three steps.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {steps.map((step, index) => <JourneyCard key={step.title} index={index} />)}
      </div>
    </section>
  );
}