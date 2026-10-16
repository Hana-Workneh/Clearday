import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({ meta: [
    { title: "Settings · Clearday" },
    { name: "description", content: "Change your currency, theme and other preferences." },
    { property: "og:title", content: "Settings · Clearday" },
    { property: "og:description", content: "Change your currency, theme and other preferences." },
  ] }),
  component: () => <PlaceholderPage title="Settings" mood="waving" text="Change your currency, theme and other preferences." />,
});
