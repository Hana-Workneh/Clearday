const KEY = "clearday-demo-welcome";
export const DEMO_WELCOME_DURATION = 6000;
export function claimDemoWelcome(storage: Pick<Storage, "getItem" | "setItem">) {
  if (storage.getItem(KEY)) return false;
  storage.setItem(KEY, "shown");
  return true;
}