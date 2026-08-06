const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomCode(): string {
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (i === 4) out += "-";
  }
  return out;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function signUpWithInviteCode(input: {
  email: string;
  password: string;
  fullName: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const code = normalizeCode(input.code);
  const email = input.email.trim().toLowerCase();

  const { data: row } = await supabaseAdmin
    .from("invite_codes")
    .select("id, email, is_active, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();

  if (!row) return { ok: false, reason: "কোডটি সঠিক নয়।" };
  if (!row.is_active) return { ok: false, reason: "এই কোডটি বাতিল করা হয়েছে।" };
  if (row.used_at) return { ok: false, reason: "এই কোডটি আগেই ব্যবহার হয়েছে।" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "কোডের মেয়াদ শেষ হয়েছে।" };
  }
  if (row.email && row.email.trim().toLowerCase() !== email) {
    return { ok: false, reason: "এই কোডটি অন্য ইমেইলের জন্য বরাদ্দ।" };
  }

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });

  if (error || !created?.user) {
    const msg = error?.message ?? "অ্যাকাউন্ট তৈরি করা যায়নি।";
    return { ok: false, reason: /already/i.test(msg) ? "এই ইমেইলে অ্যাকাউন্ট আছে — সরাসরি লগইন করুন।" : msg };
  }

  await supabaseAdmin
    .from("invite_codes")
    .update({ used_by: created.user.id, used_at: new Date().toISOString(), is_active: false })
    .eq("id", row.id);

  return { ok: true };
}
