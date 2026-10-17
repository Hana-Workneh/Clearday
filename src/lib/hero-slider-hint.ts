export const HERO_HINT_KEY = "clearday:hero-slider-hint";
export const HERO_HINT_DELAY = 1000;
export const HERO_HINT_DURATION = 1200;

export function claimHeroHint(storage: Pick<Storage, "getItem" | "setItem">): boolean {
  if (storage.getItem(HERO_HINT_KEY)) return false;
  storage.setItem(HERO_HINT_KEY, "seen");
  return true;
}

export function hintPayment(initial: number, progress: number): number {
  const offset = 40 * Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) ** 2;
  return Math.min(1000, Math.round((initial + offset) / 5) * 5);
}