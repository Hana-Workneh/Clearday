import { useEffect, useRef, useState } from "react";
import { Sprout } from "./Sprout";
import { Stone } from "./Stone";
import { usd, workDaysLabel } from "@/lib/debt";
import { stoneSize, stoneReaction, stoneIsPebbles, flagCloseness } from "@/lib/welcome-stone";
import { Clock3, Coins } from "lucide-react";

export function WelcomeCharacters({
  owe,
  pay,
  months,
  date,
  interest,
}: {
  owe: number;
  pay: number;
  months: number;
  date: string;
  interest: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef({ pay, months });
  const [reaction, setReaction] = useState<"hello" | "closer" | "further" | "calm">("hello");
  const [beat, setBeat] = useState(0);
  const close = stoneIsPebbles(months);
  const size = Math.min(110, stoneSize(owe)) * (reaction === "closer" ? .92 : reaction === "further" ? 1.05 : 1);
  useEffect(() => {
    const next = stoneReaction(previous.current, { pay, months });
    if (next !== "calm") {
      setReaction(next);
      setBeat((n) => n + 1);
    }
    previous.current = { pay, months };
    const timer = setTimeout(() => setReaction("calm"), 1200);
    return () => clearTimeout(timer);
  }, [pay, months]);
  useEffect(() => {
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const follow = (event: PointerEvent) => {
      if (!desktop.matches || reduced.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const x = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) / 90));
        const y = Math.max(-2, Math.min(2, (event.clientY - rect.top - rect.height / 2) / 100));
        el.querySelector("[data-sprout-eyes]")?.setAttribute("transform", `translate(${x} ${y})`);
      });
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => {
      window.removeEventListener("pointermove", follow);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`welcome-duo ${close ? "duo-close" : ""}`}
      data-reaction={reaction}
      data-months={months}
      data-stone-size={size}
      style={{ "--flag-closeness": flagCloseness(months) } as React.CSSProperties}
    >
      <div className="duo-ground" aria-hidden="true" />
      <div className="sprout-home-slot">
      <div key={beat} className={`presenting-sprout reaction-${reaction}`}>
      <div className="sprout-idle">
        <Sprout
          mood={reaction === "closer" || close ? "cheering" : "waving"}
          size={150}
          interactive
          worried={reaction === "further"}
        />
      </div>
        {(reaction === "closer" || close) && (
          <svg className="duo-sparkles" viewBox="0 0 200 200" aria-hidden="true">
            <g className="fill-sun">
              <path d="M22 35 L25 44 L34 47 L25 50 L22 59 L19 50 L10 47 L19 44 Z" />
              <path d="M167 18 L170 26 L178 29 L170 32 L167 40 L164 32 L156 29 L164 26 Z" />
              <path d="M177 94 L179 100 L185 102 L179 104 L177 110 L175 104 L169 102 L175 100 Z" />
            </g>
          </svg>
        )}
      </div>
      </div>
      <div className={`presenting-stone stone-reaction-${reaction}`} style={{ "--stone-size": `${size}px`, "--stone-height": `${size * 110 / 120}px` } as React.CSSProperties}>
        {!close && (
          <p className="stone-bubble" aria-live="polite">
            {reaction === "closer"
              ? "Hey! Stop paying me off!"
              : reaction === "further"
                ? "I'm not going anywhere."
                : `I'm your ${usd(owe)} debt.`}
          </p>
        )}
        <div className="stone-stage">
          {close ? (
            <svg
              viewBox="0 0 120 90"
              className="stone-pebbles"
              role="img"
              aria-label="Stone crumbled into small pebbles"
            >
              <g className="fill-stone">
                <path className="pebble-roll-left" d="M12 74 L18 65 L30 67 L34 78 L16 80 Z" />
                <path className="pebble-roll-middle" d="M49 75 L58 59 L72 64 L77 80 L53 82 Z" />
                <path className="pebble-roll-right" d="M89 78 L94 69 L105 72 L111 81 L92 84 Z" />
              </g>
              <path d="M58 59 L72 64 L65 72 L49 75 Z" className="fill-stone-shade" />
            </svg>
          ) : (
            <div className="stone-size">
              <div className="stone-impact" key={beat}>
                <div className="stone-breathe">
                  <div className="stone-grumble">
                    <Stone
                      size={170}
                      surprised={reaction === "closer"}
                      smug={reaction === "further"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {reaction === "closer" && !close && (
            <svg key={beat} viewBox="0 0 150 140" className="stone-chips" aria-hidden="true">
              <g className="fill-stone">
                <path className="chip-left" d="M16 40 L24 35 L28 45 L19 49 Z" />
                <path className="chip-right" d="M125 26 L134 30 L129 39 L120 35 Z" />
                <path className="chip-bottom" d="M112 73 L119 68 L126 76 L116 81 Z" />
              </g>
            </svg>
          )}
        </div>
        <span className="stone-label">Your debt</span>
      </div>
      <div className="debt-free-flag" aria-live="polite">
        <div className="flag-pole" aria-hidden="true" />
        <div className="flag-banner">
          <p className="text-[9px] font-bold">3. DEBT FREE BY</p>
          <p className="flag-date font-heading font-bold">{date}</p>
        </div>
      </div>
      <div className="flag-facts">
        <span className="flag-interest"><Coins className="size-3 shrink-0" />{interest === null ? "Interest grows · at 18%" : `${usd(interest)} interest · at 18%`}</span>
        <span className="flag-work"><Clock3 className="size-3" />{interest === null ? "No payoff yet" : `${workDaysLabel(interest, 1000)} of work`}</span>
        <p className="text-[9px] text-muted-foreground">Interest on $1,000/month take-home pay</p>
      </div>
    </div>
  );
}
