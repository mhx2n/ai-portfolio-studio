import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves media referenced by a PUBLISHED portfolio, streamed from the private
 * storage bucket. Files that no published portfolio references are never served.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent(String(params._splat ?? ""));
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Media lives under `<owner-id>/...`; only serve it when that owner has
        // at least one published portfolio.
        const ownerId = path.split("/")[0] ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(ownerId)) {
          return new Response("Not found", { status: 404 });
        }

        const { data: refs, error: refError } = await supabaseAdmin
          .from("portfolios")
          .select("id")
          .eq("user_id", ownerId)
          .eq("is_published", true)
          .limit(1);

        if (refError || !refs || refs.length === 0) {
          return new Response("Not found", { status: 404 });
        }


        const { data, error } = await supabaseAdmin.storage.from("portfolio-media").download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
