import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profileSchema } from "./account-data";

export const saveAccountProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({data, context}) => {
    const {error} = await context.supabase.from("profiles").upsert({id: context.userId, display_name: data.name, data, updated_at: new Date().toISOString()});
    if (error) throw new Error("Your changes could not be saved. Please try again.");
    return data;
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // The caller may delete only the identity verified by the middleware.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Your account could not be deleted. Please try again.");
    return { deleted: true };
  });