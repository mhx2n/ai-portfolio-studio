import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, ExternalLink, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/portfolio-types";
import {
  BLOG_ACCENTS,
  BLOG_FONTS,
  BLOG_LAYOUTS,
  formatDate,
  type BlogPostRow,
  type BlogSettings,
} from "@/lib/blog-types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/blog/")({
  head: () => ({
    meta: [
      { title: "ব্লগ ম্যানেজার — Folio Studio" },
      { name: "description", content: "ব্লগ পোস্ট লিখুন, প্রকাশ করুন এবং ব্লগের লুক কাস্টমাইজ করুন।" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "ব্লগ ম্যানেজার — Folio Studio" },
      { property: "og:description", content: "পোস্ট ও ব্লগ কাস্টমাইজেশনের কন্ট্রোল প্যানেল।" },
    ],
  }),
  component: BlogAdmin,
});

function BlogAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<BlogPostRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const [posts, roleCheck, cfg] = await Promise.all([
        supabase.from("blog_posts").select("*").order("updated_at", { ascending: false }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.from("blog_settings").select("title, description, accent, font, layout").maybeSingle(),
      ]);
      if (!alive) return;
      if (posts.error) toast.error("পোস্ট লোড করা যায়নি।");
      setRows((posts.data ?? []) as unknown as BlogPostRow[]);
      setIsAdmin(Boolean(roleCheck.data));
      if (cfg.data) setSettings(cfg.data as BlogSettings);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function create() {
    if (!user) return;
    setCreating(true);
    const slug = `post-${Math.random().toString(36).slice(2, 7)}`;
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        author_id: user.id,
        slug,
        title: "নতুন পোস্ট",
        body_md: "## শুরু করুন\n\nএখানে Markdown-এ লিখুন।",
      })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error("তৈরি করা যায়নি।");
      return;
    }
    navigate({ to: "/admin/blog/$id", params: { id: data.id } });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast.error("মুছে ফেলা যায়নি।");
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    toast.success("মুছে ফেলা হয়েছে।");
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase.from("blog_settings").update(settings).eq("id", true);
    setSavingSettings(false);
    if (error) {
      toast.error("সেটিংস সেভ করা যায়নি।");
      return;
    }
    toast.success("ব্লগ সেটিংস সেভ হয়েছে।");
  }

  function set<K extends keyof BlogSettings>(key: K, value: BlogSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> অ্যাডমিন প্যানেল
        </Link>

        <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ব্লগ ম্যানেজার</h1>
            <p className="mt-1 text-sm text-muted-foreground">Markdown-এ লিখুন, লাইভ প্রিভিউ দেখুন।</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/blog" target="_blank">
                <ExternalLink className="size-4" /> পাবলিক ব্লগ
              </Link>
            </Button>
            <Button onClick={create} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              নতুন পোস্ট
            </Button>
          </div>
        </header>

        <section className="mt-8 space-y-3">
          {rows === null ? (
            <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>
          ) : rows.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              এখনো কোনো পোস্ট নেই। “নতুন পোস্ট” চেপে শুরু করুন।
            </div>
          ) : (
            rows.map((r) => (
              <article key={r.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium">{r.title}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        r.is_published
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r.is_published ? "পাবলিশড" : "ড্রাফট"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    /blog/{r.slug} · <Eye className="inline size-3" /> {r.views} ·{" "}
                    {formatDate(r.published_at ?? r.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/admin/blog/$id" params={{ id: r.id }}>
                      <Pencil className="size-4" /> এডিট
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/blog/${r.slug}`);
                      toast.success("লিংক কপি হয়েছে।");
                    }}
                  >
                    <Copy className="size-4" /> লিংক
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="মুছুন" onClick={() => remove(r.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </article>
            ))
          )}
        </section>

        {isAdmin && settings ? (
          <section className="glass mt-10 rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold">ব্লগ কাস্টমাইজেশন</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              এই সেটিংস পুরো পাবলিক ব্লগে প্রযোজ্য।
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium">
                ব্লগের নাম
                <input
                  value={settings.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium">
                লেআউট
                <select
                  value={settings.layout}
                  onChange={(e) => set("layout", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  {BLOG_LAYOUTS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium sm:col-span-2">
                বর্ণনা
                <textarea
                  value={settings.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium">
                ফন্ট
                <select
                  value={settings.font}
                  onChange={(e) => set("font", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  {BLOG_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-xs font-medium">
                অ্যাকসেন্ট রঙ
                <div className="mt-2 flex flex-wrap gap-2">
                  {BLOG_ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => set("accent", c)}
                      style={{ background: c }}
                      className={`size-7 rounded-full border-2 transition-transform ${
                        settings.accent === c ? "scale-110 border-foreground" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button className="mt-5" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="size-4 animate-spin" /> : null}
              সেটিংস সেভ করুন
            </Button>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export { slugify };
