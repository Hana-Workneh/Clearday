export type SproutMood = "waving" | "happy" | "thinking" | "cheering" | "calm" | "crowned";

const bodyAnim: Record<SproutMood, string> = {
  waving: "",
  happy: "anim-bob",
  thinking: "anim-bob",
  cheering: "anim-jump",
  calm: "sprout-sway",
  crowned: "sprout-dance",
};

export function Sprout({
  mood = "happy",
  size = 120,
  className = "",
  interactive = false,
  worried = false,
  holding = false,
}: {
  mood?: SproutMood;
  size?: number;
  className?: string;
  interactive?: boolean;
  worried?: boolean;
  holding?: boolean;
}) {
  const cheers = mood === "cheering" || mood === "crowned";
  const openEyes = mood === "waving" || mood === "thinking";
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Sprout, feeling ${mood}`}
    >
      <ellipse cx="60" cy="113" rx="26" ry="4" className="fill-ink" fillOpacity="0.1" />
      <g className={bodyAnim[mood]}>
        <path d="M60 36 V30" className="stroke-leaf-dark" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 31 C52 19 40 19 35 23 C43 31 52 33 60 31 Z" className="fill-leaf-dark" />
        <path d="M60 31 C68 15 82 15 88 19 C80 29 70 33 60 31 Z" className="fill-leaf-mint" />
        {mood === "waving" && !holding && (
          <>
            <path
              d="M26 82 Q15 90 18 99"
              className="stroke-green"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <g className="wave-arm">
              <path
                d="M94 74 Q109 60 105 46"
                className="stroke-green"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </>
        )}
        {cheers && !holding && (
          <>
            <path
              d="M27 74 Q12 62 15 46"
              className="stroke-green"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M93 74 Q108 62 105 46"
              className="stroke-green"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
        <path
          d="M24 72 A36 36 0 0 1 60 36 H62 A34 34 0 0 1 96 70 V74 A34 34 0 0 1 62 108 H30 A6 6 0 0 1 24 102 Z"
          className="fill-green"
        />
        <g className={interactive ? "sprout-blink" : undefined}>
          <g data-sprout-eyes="" transform={interactive ? "translate(2 1)" : undefined}>
            {openEyes ? (
              mood === "thinking" ? (
                <>
                  <circle cx="48" cy="67" r="4" className="fill-ink" />
                  <circle cx="72" cy="67" r="4" className="fill-ink" />
                </>
              ) : (
                <>
                  <ellipse cx="48" cy="70" rx="5" ry="7" className="fill-ink" />
                  <ellipse cx="72" cy="70" rx="5" ry="7" className="fill-ink" />
                  <circle cx="50" cy="67" r="1.8" className="fill-shine" />
                  <circle cx="74" cy="67" r="1.8" className="fill-shine" />
                </>
              )
            ) : (
              <>
                <path
                  d={mood === "calm" ? "M43 70 Q48 74 53 70" : "M43 70 Q48 63 53 70"}
                  className="stroke-ink"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d={mood === "calm" ? "M67 70 Q72 74 77 70" : "M67 70 Q72 63 77 70"}
                  className="stroke-ink"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}
          </g>
        </g>
        {worried && (
          <g className="stroke-ink" strokeWidth="2" strokeLinecap="round">
            <path d="M42 59 L52 62" />
            <path d="M68 62 L78 59" />
          </g>
        )}
        <ellipse cx="39" cy="82" rx="5" ry="3" className="fill-cheek" fillOpacity="0.7" />
        <ellipse cx="81" cy="82" rx="5" ry="3" className="fill-cheek" fillOpacity="0.7" />
        {cheers ? (
          <path d="M50 80 Q60 96 70 80 Z" className="fill-ink" />
        ) : (
          <path
            d={
              worried
                ? "M54 87 Q60 82 66 87"
                : mood === "calm"
                  ? "M54 84 Q60 88 66 84"
                  : mood === "waving"
                    ? "M52 84 Q60 92 68 84"
                    : "M52 82 Q60 90 68 82"
            }
            className="stroke-ink"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {holding && (
          <g className="stroke-green" strokeWidth="8" strokeLinecap="round" fill="none">
            <path d="M26 80 Q15 91 20 108 L28 108" />
            <path d="M94 80 Q105 91 100 108 L92 108" />
          </g>
        )}
        {mood === "thinking" && !holding && (
          <path
            d="M94 86 Q103 96 84 82"
            className="stroke-green"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {mood === "calm" && (
          <path
            d="M60 104 C52 98 50 92 54 89 C57 87 60 89 60 92 C60 89 63 87 66 89 C70 92 68 98 60 104 Z"
            className="fill-sun"
          />
        )}
        {mood === "crowned" && (
          <path d="M46 40 L50 30 L56 37 L60 28 L64 37 L70 30 L74 40 Z" className="fill-sun" />
        )}
      </g>
    </svg>
  );
}
