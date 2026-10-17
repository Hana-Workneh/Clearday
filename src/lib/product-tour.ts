export const TOUR_EVENT = "clearday-take-tour";
export type TourStorage = Pick<Storage, "getItem" | "setItem">;
let replayPending = false;

export function tourStorage(demo: boolean, stores: { localStorage: TourStorage; sessionStorage: TourStorage }) {
  return demo ? stores.sessionStorage : stores.localStorage;
}

export function hasTourReplay() {
  return replayPending;
}

export function consumeTourReplay() {
  replayPending = false;
}

export function tourKey(demo: boolean, accountId: string | null) {
  return `clearday-tour:${demo ? "demo" : `account:${accountId ?? "local"}`}`;
}
export function shouldShowTour(storage: TourStorage, key: string) {
  return storage.getItem(key) !== "finished" && storage.getItem(key) !== "skipped";
}
export function rememberTour(storage: TourStorage, key: string, result: "finished" | "skipped") {
  storage.setItem(key, result);
}
export function requestProductTour() {
  replayPending = true;
  window.dispatchEvent(new Event(TOUR_EVENT));
}

export const tourSteps = [
  { target: "date", text: "This is your debt free day. Every payment moves it closer." },
  { target: "work", text: "This is how many days of work your interest costs." },
  { target: "payment", text: "Log a payment here and I'll celebrate with you." },
  { target: "faster", text: "See how a little extra brings your date closer." },
  { target: "ideas", text: "I suggest ways to earn or save more, made for your job." },
  { target: "ask", text: "Ask me anything about your plan." },
] as const;
