import { Navigate, useHydrated } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { appAccess, hasStartedSetup } from "@/lib/app-access";
import { refreshAccount, useAccount, useProfile } from "@/lib/store";
import { PageLoading } from "./PageLoading";
import { Sprout } from "./Sprout";
import { Button } from "./ui/button";

export function AppEntry({ children, setup = false }: { children: ReactNode; setup?: boolean }) {
  const account = useAccount();
  const profile = useProfile();
  const hydrated = useHydrated();
  const access = appAccess({ ready: hydrated && account.ready, profileLoaded: profile !== undefined, hasProfile: !!profile, accountId: account.id, error: account.error, setup, setupStarted: hydrated && setup && hasStartedSetup() });
  if (access === "loading") return <PageLoading />;
  if (access === "welcome") return <Navigate to="/" search={{ start: true }} replace />;
  if (access === "error") return <main className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-4 px-5 py-12 text-center"><Sprout mood="calm" size={90} /><p role="alert">{account.error}</p><Button onClick={() => refreshAccount()} className="btn-main">Reload my account</Button></main>;
  return children;
}
