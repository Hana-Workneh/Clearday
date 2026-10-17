import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Slider } from "./ui/slider";
import { simulate, addMonths, formatMonth, usd, workDaysLabel } from "@/lib/debt";

const INCOME = 1000;

/** Gently counts a number toward its target. */
function useCountUp(target: number, duration = 450) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function TryItCalculator({ owe, pay, result, onOweChange, onPayChange }: {
  owe: number;
  pay: number;
  result: ReturnType<typeof simulate>;
  onOweChange: (value: number) => void;
  onPayChange: (value: number) => void;
}) {
  const months = result.monthsLeft ?? 600;
  const animatedMonths = useCountUp(months);
  const date = addMonths(new Date(), Math.max(1, Math.round(animatedMonths)));

  const onSlide = (setter: (n: number) => void) => (v: number[]) => {
    setter(v[0] ?? 0);
  };

  return (
    <div className="welcome-calculator-scene relative w-full">
      <div className="relative w-full max-w-md">
        <div className="calculator-card-anchor">
        <div className="calculator-moment-card leaf-lg relative border bg-card p-6 sm:p-7">
          <p className="font-heading text-lg font-semibold">Try it in 10 seconds</p>
          <p className="mt-1 text-xs text-muted-foreground">Move the sliders to see your date.</p>
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="try-owe" className="text-sm font-semibold">
                1. How much you owe
              </label>
              <span className="font-heading text-sm font-bold">{usd(owe)}</span>
            </div>
            <Slider
              id="try-owe"
              className="mt-3"
              min={500}
              max={20000}
              step={100}
              value={[owe]}
              onValueChange={onSlide(onOweChange)}
              aria-label="How much you owe"
            />
          </div>
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="try-pay" className="text-sm font-semibold">
                2. What you pay each month
              </label>
              <span className="font-heading text-sm font-bold">{usd(pay)}</span>
            </div>
            <Slider
              id="try-pay"
              className="mt-3"
              min={50}
              max={1000}
              step={5}
              value={[pay]}
              onValueChange={onSlide(onPayChange)}
              aria-label="What you pay each month"
            />
          </div>
          <div className="leaf mt-6 bg-secondary p-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground">3. Your debt free date</p>
            <p className="mt-1 font-heading text-3xl font-bold leading-tight" aria-live="polite">
              {formatMonth(date)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Interest you'd pay
                </p>
                <p className="mt-0.5 font-heading text-lg font-bold">{usd(result.totalInterest)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Days of work just for interest
                </p>
                <p className="mt-0.5 font-heading text-lg font-bold">
                  {workDaysLabel(result.totalInterest, INCOME)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  (on $1,000/month take-home pay)
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
        <p className="calculator-real-date text-center text-sm text-muted-foreground">
          Want your real date?{" "}
          <Link
            to="/setup"
            className="font-semibold text-green-text underline-offset-4 hover:underline"
          >
            Find my debt free date
          </Link>
        </p>
      </div>
    </div>
  );
}
