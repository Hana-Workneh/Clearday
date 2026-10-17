export function stoneSize(owe: number) {
  return 70 + Math.max(0, Math.min(1, (owe - 500) / 19500)) * 100;
}
export function stoneReaction(
  previous: { pay: number; months: number },
  current: { pay: number; months: number },
) {
  if (current.pay > previous.pay && current.months < previous.months) return "closer";
  if (current.pay < previous.pay) return "further";
  return "calm";
}
export function stoneIsPebbles(months: number) {
  return months <= 12;
}
