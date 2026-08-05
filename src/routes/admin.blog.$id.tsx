import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { aiWrite } from "@/lib/portfolio.functions";
import { slugify, mediaUrl, type MediaItem } from "@/lib/portfolio-types";
import { readingMinutes, type BlogPostRow } from "@/lib/blog-types";
import { Button } from "@/components/ui/button";
import { MediaInput } from "@/components/admin/MediaInput";
import { Markdown } from "@/components/blog/Markdown";
import { MarkdownToolbar } from "@/components/blog/MarkdownToolbar";

export const Route = createFileRoute("/admin/blog/$id")({
  head: () => ({
    meta: [
      { title: "পোস্ট এডিটর — Folio Studio" },
      { name: "description", content: "Markdown এডিটর, লাইভ প্রিভিউ আর AI সহায়তা দিয়ে পোস্ট লিখুন।" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "পোস্ট এডিটর — Folio Studio" },
      { property: "og:description", content: "Markdown এডিটর ও লাইভ প্রিভিউ।" },
    ],
  }),
  component: PostEditor,
});

function PostEditor() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const runAi = useServerFn(aiWrite);

  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "preview" | "split">("split");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) {
          toast.error("পোস্ট পাওয়া যায়নি।");
          navigate({ to: "/admin/blog" });
          return;
        }
        setPost(data as unknown as BlogPostRow);
      });
    return () => {
      alive = false;
    };
  }, [user, id, navigate]);

  function patch(next: Partial<BlogPostRow>) {
    setPost((prev) => (prev ? { ...prev, ...next } : prev));
  }

  /** Inserts a markdown snippet at the caret inside the body textarea. */
  function insertSnippet(text: string) {
    const el = bodyRef.current;
    setPost((prev) => {
      if (!prev) return prev;
      const start = el?.selectionStart ?? prev.body_md.length;
      const end = el?.selectionEnd ?? start;
      const body = prev.body_md.slice(0, start) + text + prev.body_md.slice(end);
      requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        const caret = start + text.length;
        el.setSelectionRange(caret, caret);
      });
      return { ...prev, body_md: body };
    });
  }


  async function save(publishOverride?: boolean) {
    if (!post) return;
    const willPublish = publishOverride ?? post.is_published;
    const slug = slugify(post.slug || post.title) || `post-${Date.now()}`;
    setSaving(true);
    const { error } = await supabase
      .from("blog_posts")
      .update({
        slug,
        title: post.title,
        excerpt: post.excerpt,
        cover_path: post.cover_path,
        tags: post.tags,
        body_md: post.body_md,
        is_published: willPublish,
        published_at: willPublish ? (post.published_at ?? new Date().toISOString()) : post.published_at,
      })
      .eq("id", post.id);
    setSaving(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate") ? "এই স্লাগ আগেই ব্যবহার হয়েছে।" : "সেভ করা যায়নি।",
      );
      return;
    }
    patch({
      slug,
      is_published: willPublish,
      published_at: willPublish ? (post.published_at ?? new Date().toISOString()) : post.published_at,
    });
    toast.success(willPublish ? "প্রকাশিত হয়েছে।" : "সেভ হয়েছে।");
  }

  async function ai(kind: "text" | "tagline" | "improve", target: "body" | "excerpt") {
    if (!post) return;
    const prompt =
      kind === "improve"
        ? target === "body"
          ? post.body_md
          : (post.excerpt ?? "")
        : `${post.title}\n\n${post.body_md.slice(0, 1200)}`;
    if (prompt.trim().length < 3) {
      toast.error("আগে কিছু লিখুন বা টাইটেল দিন।");
      return;
    }
    setAiBusy(`${kind}-${target}`);
    try {
      const res = await runAi({ data: { kind, prompt: prompt.slice(0, 2000) } });
      if (!res.text) throw new Error("empty");
      if (target === "body") patch({ body_md: res.text });
      else patch({ excerpt: res.text });
      toast.success("AI লেখা বসানো হয়েছে।");
    } catch {
      toast.error("AI এখন সাড়া দিচ্ছে না, আবার চেষ্টা করুন।");
    } finally {
      setAiBusy(null);
    }
  }

  if (!post) {
    return <main className="px-5 py-16 text-center text-sm text-muted-foreground">লোড হচ্ছে…</main>;
  }

  const cover: MediaItem[] = post.cover_path
    ? [{ path: post.cover_path, name: "cover", mime: "image/*" }]
    : [];

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/admin/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> ব্লগ ম্যানেজার
          </Link>
          <div className="flex flex-wrap gap-2">
            {post.is_published ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/blog/$slug" params={{ slug: post.slug }} target="_blank">
                  <ExternalLink className="size-4" /> লাইভ দেখুন
                </Link>
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => save(false)} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              ড্রাফট সেভ
            </Button>
            <Button size="sm" onClick={() => save(!post.is_published)} disabled={saving}>
              {post.is_published ? "আনপাবলিশ" : "প্রকাশ করুন"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="glass space-y-4 rounded-2xl p-4">
            <label className="block text-xs font-medium">
              টাইটেল
              <input
                value={post.title}
                onChange={(e) => patch({ title: e.target.value })}
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-medium">
              লিংক স্লাগ
              <input
                value={post.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 font-mono text-xs"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">/blog/{post.slug}</span>
            </label>

            <div className="text-xs font-medium">
              সারসংক্ষেপ
              <textarea
                value={post.excerpt ?? ""}
                onChange={(e) => patch({ excerpt: e.target.value })}
                rows={3}
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => ai("tagline", "excerpt")}
                disabled={aiBusy !== null}
              >
                {aiBusy === "tagline-excerpt" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                AI সারসংক্ষেপ
              </Button>
            </div>

            <label className="block text-xs font-medium">
              ট্যাগ (কমা দিয়ে আলাদা)
              <input
                value={post.tags.join(", ")}
                onChange={(e) =>
                  patch({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
            </label>

            <div className="text-xs font-medium">
              কভার ইমেজ
              {user ? (
                <div className="mt-2">
                  <MediaInput
                    userId={user.id}
                    value={cover}
                    multiple={false}
                    accept="image/*"
                    label="কভার আপলোড"
                    onChange={(next) => patch({ cover_path: next[0]?.path ?? null })}
                  />
                </div>
              ) : null}
              {post.cover_path ? (
                <img
                  src={mediaUrl({ path: post.cover_path, name: "cover", mime: "image/*" })}
                  alt="কভার প্রিভিউ"
                  className="mt-2 w-full rounded-xl border object-cover"
                />
              ) : null}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {readingMinutes(post.body_md)} মিনিট পড়া · {post.views} ভিউ
            </p>
          </aside>

          <section className="glass rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 rounded-full bg-secondary p-1 text-xs">
                {(["write", "split", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-full px-3 py-1 capitalize ${
                      tab === t ? "bg-background font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {t === "write" ? "লেখা" : t === "split" ? "দুটোই" : "প্রিভিউ"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ai("text", "body")}
                  disabled={aiBusy !== null}
                >
                  {aiBusy === "text-body" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  AI ড্রাফট
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ai("improve", "body")}
                  disabled={aiBusy !== null}
                >
                  {aiBusy === "improve-body" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  AI ইমপ্রুভ
                </Button>
              </div>
            </div>

            {tab !== "preview" ? (
              <div className="mt-3">
                <MarkdownToolbar onInsert={insertSnippet} />
              </div>
            ) : null}

            <div
              className={`mt-4 grid gap-4 ${tab === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}
            >
              {tab !== "preview" ? (
                <textarea
                  ref={bodyRef}
                  value={post.body_md}
                  onChange={(e) => patch({ body_md: e.target.value })}
                  spellCheck={false}
                  className="min-h-[60vh] w-full resize-y rounded-xl border bg-background p-4 font-mono text-[13px] leading-relaxed"
                  placeholder="# হেডিং&#10;&#10;Markdown সাপোর্টেড: **বোল্ড**, `কোড`, লিস্ট, টেবিল, ইমেজ। উপরের বাটন দিয়ে ভিডিও/অডিও/কলআউট ব্লক যোগ করুন।"
                />
              ) : null}

              {tab !== "write" ? (
                <div className="min-h-[60vh] overflow-auto rounded-xl border bg-background p-4">
                  <Markdown>{post.body_md || "_প্রিভিউ এখানে দেখাবে…_"}</Markdown>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
