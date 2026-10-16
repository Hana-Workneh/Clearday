import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/_shell/progress")({
  head: () => ({ meta: [
    { title: "Progress · Clearday" },
    { name: "description", content: "Watch how far you've come. Every payment counts!" },
    { property: "og:title", content: "Progress · Clearday" },
    { property: "og:description", content: "Watch how far you've come. Every payment counts!" },
  ] }),
  component: () => <PlaceholderPage title="Progress" mood="cheering" text="Watch how far you've come. Every payment counts!" />,
});
