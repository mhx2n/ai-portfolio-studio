import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { getBlogPost } from "@/lib/blog.functions";
import { fontStack, formatDate, readingMinutes } from "@/lib/blog-types";
import { mediaUrl } from "@/lib/portfolio-types";
import { Markdown } from "@/components/blog/Markdown";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const result = await getBlogPost({ data: { slug: params.slug } });
    if (!result.post) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) {
      return { meta: [{ title: "পোস্ট পাওয়া যায়নি" }, { name: "robots", content: "noindex" }] };
    }
    const { title, excerpt } = loaderData.post;
    const description = excerpt ?? `${title} — ${loaderData.settings.title}`;
    return {
      meta: [
        { title: `${title} — ${loaderData.settings.title}` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: BlogPostPage,
});

function PostNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">পোস্ট পাওয়া যায়নি</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          লিংকটি ভুল হতে পারে, অথবা পোস্টটি এখনো প্রকাশ করা হয়নি।
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          সব পোস্ট
        </Link>
      </div>
    </div>
  );
}

function BlogPostPage() {
  const { post, settings } = Route.useLoaderData();
  if (!post) return null;

  return (
    <main
      className="min-h-screen px-5 py-10"
      style={
        {
          "--blog-accent": settings.accent,
          fontFamily: fontStack(settings.font),
        } as React.CSSProperties
      }
    >
      <article className="mx-auto max-w-2xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> সব পোস্ট
        </Link>

        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span>{formatDate(post.published_at ?? post.updated_at)}</span>
          <span>{readingMinutes(post.body_md)} মিনিট পড়া</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" /> {post.views}
          </span>
          {post.tags.map((tag: string) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>

        {post.cover_path ? (
          <img
            src={mediaUrl({ path: post.cover_path, name: post.title, mime: "image/*" })}
            alt={post.title}
            className="mt-7 w-full rounded-2xl border object-cover"
          />
        ) : null}

        <div className="mt-8">
          <Markdown>{post.body_md}</Markdown>
        </div>
      </article>
    </main>
  );
}
