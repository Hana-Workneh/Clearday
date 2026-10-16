import { createFileRoute, Link } from "@tanstack/react-router";
import { DebtFreeMoment } from "@/components/DebtFreeMoment";
import { PageLoading } from "@/components/PageLoading";
import { Sprout } from "@/components/Sprout";
import { Button } from "@/components/ui/button";
import { completedDemo, isDebtFree } from "@/lib/celebration";
import { useProfile } from "@/lib/store";
export const Route = createFileRoute("/_shell/debt-free")({
  validateSearch: (search: Record<string, unknown>) => ({preview: search["preview"] === true || search["preview"] === "true"}),
  head: () => ({meta: [{title: "Your free day · Clearday"}, {name: "description", content: "Celebrate your debt-free day and share your new chapter."}, {property: "og:title", content: "Your free day · Clearday"}, {property: "og:description", content: "Celebrate your debt-free day and share your new chapter."}, {property: "og:type", content: "website"}, {name: "twitter:card", content: "summary"}]}),
  component: FreeDay,
});
function FreeDay() {
  const profile = useProfile(); const {preview} = Route.useSearch();
  if (profile === undefined) return <PageLoading />;
  if (profile && preview && profile.demo) return <DebtFreeMoment profile={completedDemo(profile)} preview />;
  if (profile && isDebtFree(profile)) return <DebtFreeMoment profile={profile} />;
  return <div className="py-12 text-center"><Sprout mood="waving" size={110} /><h1 className="page-title mt-4">Your free day is worth looking forward to.</h1><Button asChild className="btn-main mt-6"><Link to={profile ? "/progress" : "/setup"}>{profile ? "See my progress" : "Find my free day"}</Link></Button></div>;
}