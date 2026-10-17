export const BOUNCE_COUNT = 2;
export const BOUNCE_MS = 500;
export const REPLAY_MS = 3000;
export const HOVER_MARGIN = 40;
export const VIEW_THRESHOLD = 0.5;
export function canReplay(now: number, last: number) {
  return now - last >= REPLAY_MS;
}
export function pointerTilt(fraction: number) {
  return Math.max(-4, Math.min(4, fraction * 4));
}