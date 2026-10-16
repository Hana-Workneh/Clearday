import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useAccount, useProfile, refreshAccount, leaveDemo } from "@/lib/store";
import { Sprout } from "@/components/Sprout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{title: "Your account · Clearday"}, {name: "description", content: "Keep your Clearday progress safe with your private Google account."}, {property: "og:title", content: "Your account · Clearday"}, {property: "og:description", content: "Sign in to your private Clearday account."}, {property: "og:type", content: "website"}, {name: "twitter:card", content: "summary"}] }),
  component: Auth,
});
function Auth() {
  const account = useAccount(); const profile = useProfile(); const navigate = useNavigate();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (account.id && account.ready && !account.error) { leaveDemo(); void navigate({to: profile ? "/home" : "/setup", replace: true}); } }, [account.id, account.ready, account.error, profile, navigate]);
  const signIn = async () => {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
      if (result.redirected) return;
      await refreshAccount();
    } catch { setError("Google sign-in couldn't finish. Please try again."); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 text-center">
    <div className="flex justify-center"><Sprout mood="waving" size={130} /></div>
    <h1 className="page-title mt-6">Your Clearday account</h1>
    <p className="mt-3 text-muted-foreground">Your progress, saved just for you.</p>
    <Button onClick={signIn} disabled={busy || !account.ready} className="btn-main mt-8 w-full">{busy ? <LoaderCircle className="animate-spin" /> : <span className="font-heading text-lg" aria-hidden>G</span>} Continue with Google</Button>
    {(error || account.error) && <p role="alert" className="mt-4 text-sm text-tip">{error || account.error}</p>}
    {account.error && <Button variant="outline" className="btn-secondary mt-3" onClick={() => refreshAccount()}>Reload my account</Button>}
    <p className="mt-5 text-sm text-muted-foreground">Your existing saved progress moves with you. Demo data stays in the demo.</p>
    <Button asChild variant="ghost" className="mt-6"><Link to="/"><ArrowLeft /> Back to Clearday</Link></Button>
  </main>;
}