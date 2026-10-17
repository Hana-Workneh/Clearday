import { useEffect, useRef, useState } from "react";
import { Sprout } from "./Sprout";
import { Stone } from "./Stone";

export function WelcomeCharacters({ owe, pay, months }: { owe: number; pay: number; months: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(months);
  const [reaction, setReaction] = useState<"hello" | "closer" | "further" | "calm">("hello");
  const [beat, setBeat] = useState(0);
  const close = months <= 6;
  const stoneSize = Math.round(Math.max(42, Math.min(130, 45 + (owe / 20000) * 70 + (1 - pay / 1000) * 25)));
  useEffect(() => {
    if (months !== previous.current) {
      setReaction(months < previous.current ? "closer" : "further");
      setBeat((n) => n + 1);
      previous.current = months;
    }
    const timer = setTimeout(() => setReaction("calm"), 1400);
    return () => clearTimeout(timer);
  }, [months]);
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
    return () => { window.removeEventListener("pointermove", follow); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className={`welcome-duo ${close ? "duo-close" : ""}`} data-reaction={reaction} data-months={months}>
    <div key={beat} className={`presenting-sprout reaction-${reaction}`}>
      <Sprout mood={reaction === "closer" || close ? "cheering" : reaction === "calm" ? "calm" : "waving"} size={200} interactive worried={reaction === "further"} />
      {reaction === "closer" && <svg className="duo-sparkles" viewBox="0 0 200 200" aria-hidden="true"><g className="fill-sun"><path d="M22 35 L25 44 L34 47 L25 50 L22 59 L19 50 L10 47 L19 44 Z" /><path d="M167 18 L170 26 L178 29 L170 32 L167 40 L164 32 L156 29 L164 26 Z" /><path d="M177 94 L179 100 L185 102 L179 104 L177 110 L175 104 L169 102 L175 100 Z" /></g></svg>}
    </div>
    <div className="presenting-stone">
      {close ? <svg viewBox="0 0 120 90" className="stone-pebbles" role="img" aria-label="Stone crumbled into small pebbles"><g className="fill-stone"><path d="M12 74 L18 65 L30 67 L34 78 L16 80 Z" /><path d="M49 75 L58 59 L72 64 L77 80 L53 82 Z" /><path d="M89 78 L94 69 L105 72 L111 81 L92 84 Z" /></g><path d="M58 59 L72 64 L65 72 L49 75 Z" className="fill-stone-shade" /></svg> : <Stone size={stoneSize} surprised={reaction === "closer"} />}
      {reaction === "closer" && !close && <svg key={beat} viewBox="0 0 150 140" className="stone-chips" aria-hidden="true"><g className="fill-stone"><path d="M16 40 L24 35 L28 45 L19 49 Z" /><path d="M125 26 L134 30 L129 39 L120 35 Z" /><path d="M112 73 L119 68 L126 76 L116 81 Z" /></g></svg>}
    </div>
  </div>;
}