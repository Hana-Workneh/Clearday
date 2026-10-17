import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/sprout")({server:{handlers:{
  GET:async ({request}) => (await import("@/lib/ai/sprout.server")).handleSprout(request),
  POST:async ({request}) => (await import("@/lib/ai/sprout.server")).handleSprout(request),
}}});