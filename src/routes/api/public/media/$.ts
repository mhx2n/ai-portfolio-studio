import { createFileRoute } from "@tanstack/react-router";

/**
 * Streams portfolio media out of the private storage bucket. Paths are
 * unguessable (`<owner-uuid>/<timestamp>-<random>-<name>`) and every file here is
 * uploaded specifically to be shown on a shareable portfolio page.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent(String(params._splat ?? ""));
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        // Media lives under `<owner-id>/...` — reject anything outside that shape.
        const ownerId = path.split("/")[0] ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(ownerId) || path.split("/").length !== 2) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");



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
