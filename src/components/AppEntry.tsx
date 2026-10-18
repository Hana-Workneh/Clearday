import { Navigate, useHydrated } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { appAccess, hasStartedSetup } from "@/lib/app-access";
import { hasDemoSession, useAccount, useProfile } from "@/lib/store";
import { LoadingTrouble, PageLoading } from "./PageLoading";

export function AppEntry({ children, setup = false }: { children: ReactNode; setup?: boolean }) {
  const account = useAccount();
  const profile = useProfile();
  const hydrated = useHydrated();
  // Demo first: a saved demo renders from this tab without waiting for sign-in checks.
  const demo = hydrated && hasDemoSession();
  const access = appAccess({ ready: hydrated && (account.ready || demo), profileLoaded: profile !== undefined, hasProfile: !!profile, accountId: account.id, error: demo ? "" : account.error, setup, setupStarted: hydrated && setup && hasStartedSetup() });
  if (access === "loading") return <PageLoading />;
  if (access === "welcome") return <Navigate to="/" search={{ start: true }} replace />;
  if (access === "error") return <LoadingTrouble />;
  return children;
}
