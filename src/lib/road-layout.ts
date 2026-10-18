/** Display-only spacing; financial percentages remain unchanged. */
export function verticalRoadLayout(stops: { id: string; pct: number }[], percent: number, completed: boolean) {
  const events = [
    ...stops.map(stop => ({ id: stop.id, pct: stop.pct, gap: 48 })),
    { id: "sprout", pct: percent, gap: 76 },
    ...(!completed ? [{ id: "stone", pct: Math.min(99, percent + 9), gap: 64 }] : []),
    { id: "flag", pct: 100, gap: 64 },
  ].sort((a, b) => a.pct - b.pct || (a.id === "flag" ? 1 : -1));
  const positions: Record<string, number> = {};
  let previousPercent = 0;
  let previousGap = 0;
  let y = 16;
  for (const event of events) {
    y += Math.max((event.pct - previousPercent) * 3, previousGap, event.gap);
    positions[event.id] = y;
    previousPercent = event.pct;
    previousGap = event.gap;
  }
  return { positions, start: 16, end: positions.flag ?? y, height: y + 48 };
}