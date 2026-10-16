export type SproutMood = "waving" | "happy" | "thinking" | "cheering" | "calm";

const bodyAnim: Record<SproutMood, string> = {
  waving: "anim-bob",
  happy: "anim-bob",
  thinking: "anim-sway",
  cheering: "anim-jump",
  calm: "anim-sway",
};

export function Sprout({ mood = "happy", size = 120, className = "" }: { mood?: SproutMood; size?: number; className?: string }) {
  const eyeCy = mood === "thinking" ? 70 : 74;
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * 1.08} className={className} role="img" aria-label={`Sprout, feeling ${mood}`}>
      <g className={bodyAnim[mood]}>
        {/* stem */}
        <path d="M60 36 V18" className="stroke-green" strokeWidth="4" strokeLinecap="round" />
        {/* top leaves: dark green left, light mint right */}
        <path d="M60 20 C54 8 40 5 33 11 C39 21 52 25 60 20 Z" className="fill-leaf-dark" />
        <path d="M60 20 C66 8 80 5 87 11 C81 21 68 25 60 20 Z" className="fill-leaf-mint" />
        {/* body: leaf shape, small pointed corner bottom-left */}
        <path d="M26 116 L74 116 A26 26 0 0 0 100 90 L100 60 A26 26 0 0 0 74 34 L46 34 A26 26 0 0 0 20 60 L20 110 A6 6 0 0 0 26 116 Z" className="fill-green" />
        {/* eyes */}
        {mood === "cheering" || mood === "calm" ? (
          <>
            <path d="M41 74 q5 -6 10 0" className="stroke-ink" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M69 74 q5 -6 10 0" className="stroke-ink" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="45" cy={eyeCy} rx="6.5" ry="8.5" className="fill-ink" />
            <ellipse cx="75" cy={eyeCy} rx="6.5" ry="8.5" className="fill-ink" />
            <circle cx="47.5" cy={eyeCy - 3.5} r="2" className="fill-shine" />
            <circle cx="77.5" cy={eyeCy - 3.5} r="2" className="fill-shine" />
          </>
        )}
        {/* cheeks */}
        <ellipse cx="33" cy="86" rx="7" ry="4.5" className="fill-cheek" opacity=".85" />
        <ellipse cx="87" cy="86" rx="7" ry="4.5" className="fill-cheek" opacity=".85" />
        {/* mouth */}
        {mood === "thinking" ? (
          <path d="M54 91 q6 -3 12 0" className="stroke-ink" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : mood === "cheering" ? (
          <path d="M50 86 q10 14 20 0 Z" className="fill-ink" />
        ) : (
          <path d="M52 88 q8 8 16 0" className="stroke-ink" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        )}
        {/* arms: thin rounded, same green as body */}
        {mood === "waving" && (
          <path d="M100 78 q14 -8 16 -24" className="stroke-green anim-wave" strokeWidth="5" fill="none" strokeLinecap="round" />
        )}
        {mood === "cheering" && (
          <>
            <path d="M20 78 q-13 -9 -13 -25" className="stroke-green" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 78 q13 -9 13 -25" className="stroke-green" strokeWidth="5" fill="none" strokeLinecap="round" />
            <circle cx="7" cy="43" r="3" className="fill-sun" />
            <circle cx="113" cy="43" r="3" className="fill-sun" />
          </>
        )}
        {mood === "thinking" && (
          <path d="M20 88 q12 8 24 -4" className="stroke-green" strokeWidth="5" fill="none" strokeLinecap="round" />
        )}
        {mood === "calm" && (
          <>
            <path d="M20 84 q14 14 30 18" className="stroke-green" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 84 q-14 14 -30 18" className="stroke-green" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M60 112 c-10 -6 -14 -12 -10 -16 c3 -3 7 -1 10 3 c3 -4 7 -6 10 -3 c4 4 0 10 -10 16Z" className="fill-cheek" />
          </>
        )}
      </g>
    </svg>
  );
}
