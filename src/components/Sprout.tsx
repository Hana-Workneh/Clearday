export type SproutMood = "waving" | "happy" | "thinking" | "cheering" | "calm";

const bodyAnim: Record<SproutMood, string> = {
  waving: "anim-bob",
  happy: "anim-bob",
  thinking: "anim-sway",
  cheering: "anim-jump",
  calm: "anim-sway",
};

export function Sprout({ mood = "happy", size = 120, className = "" }: { mood?: SproutMood; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * 1.08} className={className} role="img" aria-label={`Sprout, feeling ${mood}`}>
      <g className={bodyAnim[mood]}>
        {/* top leaves */}
        <path d="M60 30 C50 14 36 12 32 18 C40 26 50 30 60 30Z" className="fill-green-text" />
        <path d="M60 30 C70 12 86 10 90 16 C82 26 70 30 60 30Z" className="fill-green-text" />
        <path d="M60 32 V22" className="stroke-green-text" strokeWidth="3" strokeLinecap="round" />
        {/* body */}
        <path d="M60 30 C92 30 102 62 98 84 C94 108 78 118 60 118 C42 118 26 108 22 84 C18 62 28 30 60 30Z" className="fill-green" />
        <path d="M60 40 V108" className="stroke-green-text" strokeWidth="2" strokeLinecap="round" opacity=".35" />
        {/* eyes */}
        {mood === "cheering" || mood === "calm" ? (
          <>
            <path d="M42 72 q5 -6 10 0" className="stroke-ink" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M68 72 q5 -6 10 0" className="stroke-ink" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="47" cy={mood === "thinking" ? 68 : 72} r="5" className="fill-ink" />
            <circle cx="73" cy={mood === "thinking" ? 68 : 72} r="5" className="fill-ink" />
            <circle cx="48.5" cy={mood === "thinking" ? 66.5 : 70.5} r="1.6" className="fill-card" />
            <circle cx="74.5" cy={mood === "thinking" ? 66.5 : 70.5} r="1.6" className="fill-card" />
          </>
        )}
        {/* cheeks */}
        <ellipse cx="38" cy="84" rx="6" ry="4" className="fill-cheek" opacity=".85" />
        <ellipse cx="82" cy="84" rx="6" ry="4" className="fill-cheek" opacity=".85" />
        {/* mouth */}
        {mood === "thinking" ? (
          <path d="M54 88 q6 -3 12 0" className="stroke-ink" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : mood === "cheering" ? (
          <path d="M50 84 q10 14 20 0 Z" className="fill-ink" />
        ) : (
          <path d="M52 84 q8 8 16 0" className="stroke-ink" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {/* arms */}
        {mood === "waving" && (
          <path d="M96 76 q12 -8 14 -22" className="stroke-green-text anim-wave" strokeWidth="5" fill="none" strokeLinecap="round" />
        )}
        {mood === "cheering" && (
          <>
            <path d="M24 74 q-12 -8 -12 -24" className="stroke-green-text" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M96 74 q12 -8 12 -24" className="stroke-green-text" strokeWidth="5" fill="none" strokeLinecap="round" />
            <circle cx="14" cy="40" r="3" className="fill-sun" />
            <circle cx="106" cy="38" r="3" className="fill-sun" />
          </>
        )}
        {mood === "thinking" && (
          <path d="M30 92 q10 6 22 -2" className="stroke-green-text" strokeWidth="5" fill="none" strokeLinecap="round" />
        )}
        {mood === "calm" && (
          <path d="M60 112 c-10 -6 -14 -12 -10 -16 c3 -3 7 -1 10 3 c3 -4 7 -6 10 -3 c4 4 0 10 -10 16Z" className="fill-sun" />
        )}
      </g>
    </svg>
  );
}
