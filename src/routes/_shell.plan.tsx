import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/_shell/plan")({
  head: () => ({ meta: [
    { title: "My plan · Clearday" },
    { name: "description", content: "See your step-by-step path to being debt free." },
    { property: "og:title", content: "My plan · Clearday" },
    { property: "og:description", content: "See your step-by-step path to being debt free." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <PlaceholderPage title="My plan" mood="calm" text="See your step-by-step path to being debt free." />,
});
