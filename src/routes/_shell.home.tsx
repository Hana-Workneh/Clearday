import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/_shell/home")({
  head: () => ({ meta: [
    { title: "Home · Clearday" },
    { name: "description", content: "Your loans and your debt free date, all in one place." },
    { property: "og:title", content: "Home · Clearday" },
    { property: "og:description", content: "Your loans and your debt free date, all in one place." },
  ] }),
  component: () => <PlaceholderPage title="Home" mood="happy" text="Your loans and your debt free date, all in one place." />,
});
