import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const signUpWithInvite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(6).max(200),
        fullName: z.string().trim().min(1).max(120),
        code: z.string().trim().min(4).max(40),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { signUpWithInviteCode } = await import("./invites.server");
    return signUpWithInviteCode(data);
  });

export const createInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().max(255).optional(),
        note: z.string().trim().max(200).optional(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { randomCode } = await import("./invites.server");
    const expires_at = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86400000).toISOString()
      : null;

    const { data: row, error } = await context.supabase
      .from("invite_codes")
      .insert({
        code: randomCode(),
        email: data.email?.trim().toLowerCase() || null,
        note: data.note || null,
        expires_at,
        created_by: context.userId,
      })
      .select()
      .single();

    if (error) throw error;
    return row;
  });
