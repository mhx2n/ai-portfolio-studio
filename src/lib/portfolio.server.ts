import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PortfolioContent } from "./portfolio-types";

export type PublicPortfolio = {
  slug: string;
  title: string;
  tagline: string | null;
  theme: string;
  views: number;
  content: PortfolioContent;
  updated_at: string;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
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

export async function loadPublicPortfolio(slug: string): Promise<PublicPortfolio | null> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("slug, title, tagline, theme, views, content, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PublicPortfolio;
}

export async function bumpViews(slug: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("portfolios")
      .select("views")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return;
    await supabaseAdmin
      .from("portfolios")
      .update({ views: (data.views ?? 0) + 1 })
      .eq("slug", slug);
  } catch {
    // view counting must never break rendering
  }
}

const SYSTEM_PROMPT = `You are a portfolio copywriter. Write concise, confident, human copy.
Never use emojis. Never use markdown headings. Reply with the requested text only, no preamble.
If the user's input is in Bengali, reply in Bengali; otherwise reply in English.`;

export async function generateCopy(kind: string, prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const task: Record<string, string> = {
    hero: "Write a short hero introduction (2-3 sentences) for this person.",
    text: "Write an engaging 'About me' paragraph (60-110 words).",
    projects: "Write a crisp project description (max 40 words).",
    tagline: "Write one punchy tagline (max 12 words).",
    improve: "Rewrite and improve the following text, keeping the meaning.",
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${task[kind] ?? task["improve"]}\n\nInput:\n${prompt}` },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}
