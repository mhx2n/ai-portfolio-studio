import { createFileRoute } from "@tanstack/react-router";

/**
 * Tiny public endpoint that touches the database so the project never looks
 * idle. Safe to ping from any uptime service (cron-job.org, UptimeRobot, …).
 */
export const Route = createFileRoute("/api/public/keepalive")({
  server: {
    handlers: {
      GET: async () => {
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
          await client.from("blog_settings").select("id").limit(1);
          return Response.json({ ok: true, at: new Date().toISOString() });
        } catch {
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
