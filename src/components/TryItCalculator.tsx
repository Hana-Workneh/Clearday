import { useEffect, useRef, useState } from "react";
import { HeroSlider } from "./HeroSlider";
import { claimHeroHint, HERO_HINT_KEY, HERO_HINT_DELAY, HERO_HINT_DURATION, hintPayment } from "@/lib/hero-slider-hint";
import { WelcomeCharacters } from "./WelcomeCharacters";
import { simulate, addMonths, formatMonth } from "@/lib/debt";

export function TryItCalculator({
  owe,
  pay,
  result,
  onOweChange,
  onPayChange,
}: {
  owe: number;
  pay: number;
  result: ReturnType<typeof simulate>;
  onOweChange: (value: number) => void;
  onPayChange: (value: number) => void;
}) {
  const touched = useRef(false);
  const [selfDemo, setSelfDemo] = useState(false);
  const [hint, setHint] = useState(false);
  const [hand, setHand] = useState(false);
  const setPayment = useRef(onPayChange);
  setPayment.current = onPayChange;
  useEffect(() => {
    let frame = 0;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      if (touched.current || !claimHeroHint(sessionStorage)) return;
      setHint(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        finishTimer = setTimeout(() => setHint(false), HERO_HINT_DURATION);
        return;
      }
      setHand(true);
      setSelfDemo(true);
      const start = performance.now();
      const initial = pay;
      const glide = (now: number) => {
        if (touched.current) {
          setSelfDemo(false);
          return;
        }
        const progress = Math.min(1, (now - start) / HERO_HINT_DURATION);
        setPayment.current(hintPayment(initial, progress));
        if (progress < 1) frame = requestAnimationFrame(glide);
        else {
          setSelfDemo(false);
          setHint(false);
          setHand(false);
        }
      };
      frame = requestAnimationFrame(glide);
    }, HERO_HINT_DELAY);
    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
      cancelAnimationFrame(frame);
    };
  }, []);
  const touch = () => {
    touched.current = true;
    sessionStorage.setItem(HERO_HINT_KEY, "dismissed");
    setSelfDemo(false);
    setHint(false);
    setHand(false);
  };
  const months = result.monthsLeft ?? 600;
  const date = result.debtFreeDate ?? addMonths(new Date(), months);
  return (
    <div className="hero-scene-panel w-full" data-self-demo={selfDemo}>
      <div className="hero-slider-card" onPointerDown={touch} onKeyDown={touch}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="min-w-0 font-heading text-base font-semibold sm:text-lg">
            Try it in 10 seconds
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-chip-green px-2 py-1 text-[10px] font-bold text-chip-green-text">
            <span className="size-1.5 rounded-full bg-green" />
            Live
          </span>
        </div>
        <div className="mt-4">
          <div className="hero-slider-label">
            <span className="hero-step">1</span>
            <label htmlFor="try-owe">How much you owe</label>
            <span className="hero-slider-value">${owe.toLocaleString("en-US")}</span>
          </div>
          <HeroSlider
            id="try-owe"
            min={500}
            max={20000}
            step={100}
            value={[owe]}
            onValueChange={(v) => {
              touch();
              onOweChange(v[0] ?? 500);
            }}
            aria-label="How much you owe"
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>$500</span>
            <span>$20,000</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="hero-slider-label">
            <span className="hero-step">2</span>
            <label htmlFor="try-pay">What you pay each month</label>
            <span className="hero-slider-value">${pay.toLocaleString("en-US")}</span>
          </div>
            <HeroSlider
              hint={hint}
              hand={hand}
              id="try-pay"
              min={50}
              max={1000}
              step={5}
              value={[pay]}
              onValueChange={(v) => {
                touch();
                onPayChange(v[0] ?? 50);
              }}
              aria-label="What you pay each month"
            />
          <div className="mt-2 flex items-start justify-between gap-2 text-[10px] text-muted-foreground">
            <span>$50</span>
            <span>$1,000</span>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Have more than one loan? Add each one after you start. Clearday uses every loan's own interest rate.</p>
      </div>
      <WelcomeCharacters
        owe={owe}
        pay={pay}
        months={months}
        date={result.monthsLeft === null ? "Raise payment" : formatMonth(date)}
        interest={result.monthsLeft === null ? null : result.totalInterest}
      />
    </div>
  );
}
