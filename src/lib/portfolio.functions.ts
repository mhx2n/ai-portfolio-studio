import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPublicPortfolio = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { loadPublicPortfolio, bumpViews } = await import("./portfolio.server");
    const portfolio = await loadPublicPortfolio(data.slug);
    if (portfolio) await bumpViews(data.slug);
    return portfolio;
  });

export const aiWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["hero", "text", "projects", "tagline", "improve"]),
        prompt: z.string().min(3).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { generateCopy } = await import("./portfolio.server");
    return { text: await generateCopy(data.kind, data.prompt) };
  });
