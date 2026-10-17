export function exactExtra(raw: string, max: number): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : null;
}