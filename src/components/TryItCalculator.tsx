import { useEffect, useRef, useState } from "react";
import { Slider } from "./ui/slider";
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
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [selfDemo, setSelfDemo] = useState(false);
  const setPayment = useRef(onPayChange);
  setPayment.current = onPayChange;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const timer = setTimeout(() => {
      if (touched.current) return;
      setSelfDemo(true);
      const start = performance.now();
      const glide = (now: number) => {
        if (touched.current) {
          setSelfDemo(false);
          return;
        }
        const progress = Math.min(1, (now - start) / 500);
        setPayment.current(Math.round((155 + 65 * (1 - Math.pow(1 - progress, 3))) / 5) * 5);
        if (progress < 1) frame = requestAnimationFrame(glide);
        else setSelfDemo(false);
      };
      frame = requestAnimationFrame(glide);
    }, 1600);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);
  const touch = () => {
    touched.current = true;
    setSelfDemo(false);
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
          <Slider
            id="try-owe"
            className="mt-3"
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
          <div
            className={paymentTouched ? "" : "hero-payment-pulse"}
            onPointerDown={() => setPaymentTouched(true)}
            onKeyDown={() => setPaymentTouched(true)}
          >
            <Slider
              id="try-pay"
              className="mt-3"
              min={50}
              max={1000}
              step={5}
              value={[pay]}
              onValueChange={(v) => {
                touch();
                setPaymentTouched(true);
                onPayChange(v[0] ?? 50);
              }}
              aria-label="What you pay each month"
            />
          </div>
          <div className="mt-2 flex items-start justify-between gap-2 text-[10px] text-muted-foreground">
            <span>$50</span>
            <span className="text-center font-semibold text-green-text">
              ← drag me, watch the flag move
            </span>
            <span>$1,000</span>
          </div>
        </div>
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
