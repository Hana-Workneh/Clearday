import { useMemo } from "react";

const colors = ["bg-sun", "bg-green", "bg-sun", "bg-tip", "bg-sun"];

export function Confetti({ count = 60 }: { count?: number }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 1.2, size: 6 + Math.random() * 8, color: colors[i % colors.length], round: i % 2 === 0,
  })), [count]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b, i) => (
        <span key={i} className={`anim-confetti absolute top-0 ${b.color} ${b.round ? "rounded-full" : "rounded-sm"}`}
          style={{ left: `${b.left}%`, width: b.size, height: b.size * (b.round ? 1 : 1.6), animationDelay: `${b.delay}s`, transform: "translateY(-10vh)" }} />
      ))}
    </div>
  );
}
