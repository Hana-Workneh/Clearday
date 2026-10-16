import { useId } from "react";

/** The clearday ring mark. `animate` draws the ring once and pops the dot (reduced motion respected in CSS). */
export function CleardayMark({ size = 32, animate = false }: { size?: number; animate?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 52 52" width={size} height={size} aria-hidden="true" className={animate ? "logo-animate" : undefined}>
      <defs>
        <linearGradient id={`cdRing${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--logo-ring-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-ring-b)" }} />
        </linearGradient>
      </defs>
      <path className="logo-ring" pathLength={100} d="M40.1 11.9 A20 20 0 1 0 45.3 31.2" fill="none" stroke={`url(#cdRing${id})`} strokeWidth="9" strokeLinecap="round" />
      <circle className="logo-dot" cx="44" cy="15" r="6.5" style={{ fill: "var(--sun)" }} />
    </svg>
  );
}

export function CleardayLogo({ animate = false }: { animate?: boolean }) {
  return <span className="inline-flex shrink-0 items-center gap-2" aria-label="clearday">
    <CleardayMark size={32} animate={animate} />
    <span className="font-heading text-[23px] font-semibold leading-none">clearday</span>
  </span>;
}
