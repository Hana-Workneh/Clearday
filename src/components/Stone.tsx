export function Stone({
  size = 110,
  surprised = false,
  smug = false,
  pebble = false,
}: {
  size?: number;
  surprised?: boolean;
  smug?: boolean;
  pebble?: boolean;
}) {
  if (pebble)
    return (
      <svg
        viewBox="0 0 120 110"
        width={size}
        height={(size * 110) / 120}
        role="img"
        aria-label="Stone, a tiny debt pebble"
      >
        <path
          d="M22 92 L14 62 L30 30 L58 18 L88 26 L106 52 L100 88 L72 98 L40 99 Z"
          fill="var(--stone)"
        />
        <path d="M58 18 L88 26 L106 52 L76 46 Z" fill="var(--stone-light)" />
      </svg>
    );
  return (
    <svg
      viewBox="0 0 120 110"
      width={size}
      height={(size * 110) / 120}
      role="img"
      aria-label={`Stone, the ${surprised ? "surprised" : smug ? "smug" : "grumpy"} debt rock`}
    >
      <ellipse cx="60" cy="104" rx="40" ry="5" fill="var(--stone-shadow)" fillOpacity="0.12" />
      <path
        d="M22 92 L14 62 L30 30 L58 18 L88 26 L106 52 L100 88 L72 98 L40 99 Z"
        fill="var(--stone)"
      />
      <path d="M58 18 L88 26 L106 52 L76 46 Z" fill="var(--stone-light)" />
      <path d="M30 30 L58 18 L76 46 L44 50 Z" fill="var(--stone-upper)" />
      <path d="M14 62 L30 30 L44 50 L34 78 Z" fill="var(--stone-left)" />
      <path d="M100 88 L106 52 L76 46 L80 84 Z" fill="var(--stone-right)" />
      <path d="M22 92 L34 78 L80 84 L72 98 L40 99 Z" fill="var(--stone-bottom)" />
      <g className={surprised ? "stone-face-surprised" : smug ? "stone-face-smug" : undefined}>
        <path
          className="stone-brow-left"
          d="M40 52 L52 57"
          stroke="var(--stone-face)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          className="stone-brow-right"
          d="M80 52 L68 57"
          stroke="var(--stone-face)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <ellipse cx="47" cy="63" rx="4" ry="4.5" fill="var(--stone-face)" />
        <ellipse cx="73" cy="63" rx="4" ry="4.5" fill="var(--stone-face)" />
        <circle cx="48.3" cy="61.5" r="1.3" fill="var(--shine)" />
        <circle cx="74.3" cy="61.5" r="1.3" fill="var(--shine)" />
        <path
          className="stone-mouth"
          d="M52 77 Q60 72 68 77"
          stroke="var(--stone-face)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <path
        d="M16 76 Q8 72 6 64"
        stroke="var(--stone-shade)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M104 76 Q112 72 114 64"
        stroke="var(--stone-shade)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M44 99 V105 M76 98 V105"
        stroke="var(--stone-shade)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
