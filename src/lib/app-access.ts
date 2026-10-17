/** Display-only entry decisions; account ownership still protects private data. */
export function appAccess(s: { ready: boolean; profileLoaded: boolean; hasProfile: boolean; accountId: string | null; error: string; setup: boolean; setupStarted: boolean }): "loading" | "error" | "welcome" | "allow" {
  if (!s.ready || !s.profileLoaded) return "loading";
  if (s.error) return "error";
  if (s.hasProfile || s.accountId || (s.setup && s.setupStarted)) return "allow";
  return "welcome";
}
export function beginSetup() { sessionStorage.setItem("clearday-setup-started", "true"); }
export function hasStartedSetup() { return sessionStorage.getItem("clearday-setup-started") === "true"; }
