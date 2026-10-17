export function Stone({ size = 110, surprised = false, pebble = false }: { size?: number; surprised?: boolean; pebble?: boolean }) {
  return <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={pebble ? "Stone, a tiny debt pebble" : `Stone, the ${surprised ? "surprised" : "grumpy"} debt rock`}>
    <ellipse cx="60" cy="110" rx="42" ry="4" className="fill-ink" fillOpacity="0.1" />
    <path d="M13 76 L24 39 L47 20 L81 25 L103 51 L111 86 L94 107 L29 106 Z" className="fill-stone" />
    <path d="M13 76 L24 39 L47 20 L44 51 Z M81 25 L103 51 L111 86 L87 75 Z M13 76 L29 106 L94 107 L87 75 L63 94 Z" className="fill-stone-shade" />
    <path d="M24 39 L44 51 L81 25 L47 20 Z" className="fill-stone-light" />
    <g className="stroke-ink" strokeWidth="3" strokeLinecap="round" fill="none">
      {surprised ? <><circle cx="49" cy="63" r="3" className="fill-ink" /><circle cx="75" cy="63" r="3" className="fill-ink" /><ellipse cx="62" cy="79" rx="4" ry="6" /></> : <><path d="M44 58 L54 61 M70 61 L80 58" /><path d="M48 65 L51 65 M73 65 L76 65 M55 80 L68 80" /></>}
      {!pebble && <><path d="M28 79 Q39 94 69 90 L75 86" /><path d="M94 80 Q82 96 56 87 L49 85" /></>}
    </g>
  </svg>;
}