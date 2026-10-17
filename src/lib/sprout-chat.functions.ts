import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const saveStoppedSproutMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1).max(100), text: z.string().max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sprout_messages")
      .upsert(
        {
          user_id: context.userId,
          message_id: data.id,
          role: "assistant",
          parts: [{ type: "text", text: data.text + "\n\nStopped." }],
        },
        { onConflict: "user_id,message_id" },
      );
    if (error) throw new Error("Your stopped answer could not be saved.");
    return { saved: true };
  });
