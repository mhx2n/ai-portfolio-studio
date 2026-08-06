import { createFileRoute } from "@tanstack/react-router";

/**
 * Streams portfolio media out of the private storage bucket. Paths are
 * unguessable (`<owner-uuid>/<timestamp>-<random>-<name>`) and every file here is
 * uploaded specifically to be shown on a shareable portfolio page.
 *
 * The publishable key is used first (it works on every host, including ones
 * where the service-role key is not configured); the admin client is only a
 * fallback.
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

        const download = async () => {
          try {
            const { createClient } = await import("@supabase/supabase-js");
            const { serverSupabaseConfig } = await import("@/lib/server-env");
            const { url, key } = serverSupabaseConfig();
            const client = createClient(url, key, {
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
            const res = await client.storage.from("portfolio-media").download(path);
            if (res.data) return res.data;
          } catch {
            // fall through to the admin client
          }
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const res = await supabaseAdmin.storage.from("portfolio-media").download(path);
            return res.data ?? null;
          } catch {
            return null;
          }
        };

        const blob = await download();
        if (!blob) return new Response("Not found", { status: 404 });

        return new Response(blob, {
          headers: {
            "content-type": blob.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
