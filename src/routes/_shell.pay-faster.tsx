import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/_shell/pay-faster")({
  head: () => ({ meta: [
    { title: "Pay faster · Clearday" },
    { name: "description", content: "Find simple ways to reach your free day sooner." },
    { property: "og:title", content: "Pay faster · Clearday" },
    { property: "og:description", content: "Find simple ways to reach your free day sooner." },
  ] }),
  component: () => <PlaceholderPage title="Pay faster" mood="thinking" text="Find simple ways to reach your free day sooner." />,
});
