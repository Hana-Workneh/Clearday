import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advice")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleAdvice } = await import("@/lib/ai/advice.server");
    return handleAdvice(request);
  } } },
});