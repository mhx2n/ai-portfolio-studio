import { createFileRoute, Link } from "@tanstack/react-router";
import { Pin } from "lucide-react";
import { getBlogIndex } from "@/lib/blog.functions";
import { formatDate } from "@/lib/blog-types";
import type { PublicPostCard } from "@/lib/blog-types";
import { mediaUrl } from "@/lib/portfolio-types";
import { JournalShell } from "@/components/blog/JournalShell";

export const Route = createFileRoute("/blog/")({
  loader: () => getBlogIndex(),
  head: ({ loaderData }) => {
    const title = loaderData?.settings.title ?? "Blog";
    const description = loaderData?.settings.description ?? "লেখা ও নোট।";
    return {
      meta: [
        { title: `${title} — সব পোস্ট` },
        { name: "description", content: description },
        { property: "og:title", content: `${title} — সব পোস্ট` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { settings, posts } = Route.useLoaderData();
  const featured = settings.layout === "magazine" ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <JournalShell settings={settings}>
      <main className="px-5">
        <section className="mx-auto max-w-2xl pb-10 pt-14 text-center sm:pt-20">
          <p className="journal-serif text-sm italic text-muted-foreground sm:text-base">
            ~ an editorial corner of the internet ~
          </p>
          <h1 className="journal-serif mt-4 text-[3.1rem] leading-[1.02] tracking-tight sm:text-7xl">
            {settings.title}
          </h1>
          <div className="journal-rule">
            <span />
          </div>
          <p className="journal-serif mx-auto max-w-xl text-lg italic leading-relaxed text-muted-foreground sm:text-xl">
            {settings.description}
          </p>
        </section>

        <section className="mx-auto max-w-3xl pb-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b pb-5">
            <h2 className="journal-serif truncate text-3xl">Latest entries</h2>
            <span className="journal-kicker shrink-0">
              {posts.length} {posts.length === 1 ? "piece" : "pieces"}
            </span>
          </div>

          {posts.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">
              এখনো কোনো পোস্ট প্রকাশ করা হয়নি।
            </p>
          ) : (
            <div className="mt-8 space-y-6">
              {featured ? <PostCard post={featured} featured /> : null}
              <div
                className={
                  settings.layout === "cards"
                    ? "grid gap-6 sm:grid-cols-2"
                    : "space-y-6"
                }
              >
                {rest.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </JournalShell>
  );
}

function PostCard({ post, featured }: { post: PublicPostCard; featured?: boolean }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="journal-card"
      style={featured ? { borderColor: "var(--blog-accent)" } : undefined}
    >
      {post.cover_path ? (
        <img
          src={mediaUrl({ path: post.cover_path, name: post.title, mime: "image/*" })}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className={`w-full object-cover ${featured ? "h-56 sm:h-72" : "h-48"}`}
        />
      ) : null}
      <div className="p-5 sm:p-6">
        <p className="journal-kicker flex items-center gap-2">
          <Pin className="size-3.5 shrink-0" aria-hidden />
          {post.tags.length ? post.tags.slice(0, 2).join(" • ") : "journal"}
        </p>
        <h3 className="journal-serif mt-2.5 text-2xl leading-snug sm:text-3xl">{post.title}</h3>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
        <p className="journal-kicker mt-3">{formatDate(post.published_at ?? post.updated_at)}</p>
      </div>
    </Link>
  );
}
