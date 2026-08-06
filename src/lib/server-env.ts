/**
 * Server-side Supabase config resolver.
 *
 * On some hosts only the VITE_* variables get configured. Those are inlined at
 * build time, so they remain a valid fallback for server code when the
 * server-only names are missing from the runtime environment.
 */
export function serverSupabaseConfig() {
  const url =
    process.env["SUPABASE_URL"] ||
    import.meta.env["VITE_SUPABASE_URL"] ||
    "";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "";

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or VITE_ equivalents) in your hosting environment.",
    );
  }

  return { url, key };
}
