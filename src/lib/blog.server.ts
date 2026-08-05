import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { BlogSettings, PublicPost, PublicPostCard } from "./blog-types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const DEFAULT_SETTINGS: BlogSettings = {
  title: "Folio Blog",
  description: "লেখা, নোট আর টেকনিক্যাল ব্রেকডাউন।",
  accent: "#6ee7f9",
  font: "space-grotesk",
  layout: "list",
};

export async function loadBlogSettings(): Promise<BlogSettings> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("blog_settings")
    .select("title, description, accent, font, layout")
    .maybeSingle();
  return (data as BlogSettings | null) ?? DEFAULT_SETTINGS;
}

export async function loadPublishedPosts(): Promise<PublicPostCard[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_path, tags, published_at, views, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);
  return (data ?? []) as unknown as PublicPostCard[];
}

export async function loadPublishedPost(slug: string): Promise<PublicPost | null> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_path, tags, body_md, published_at, views, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as unknown as PublicPost | null) ?? null;
}

export async function bumpPostViews(slug: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("views")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return;
    await supabaseAdmin
      .from("blog_posts")
      .update({ views: (data.views ?? 0) + 1 })
      .eq("slug", slug);
  } catch {
    // view counting must never break rendering
  }
}
