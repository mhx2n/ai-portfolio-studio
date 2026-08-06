import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { getBlogPost } from "@/lib/blog.functions";
import { formatDate, readingMinutes } from "@/lib/blog-types";
import { mediaUrl } from "@/lib/portfolio-types";
import { Markdown } from "@/components/blog/Markdown";
import { JournalShell } from "@/components/blog/JournalShell";

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
    <div className="blog-journal flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="journal-serif text-4xl">পোস্ট পাওয়া যায়নি</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          লিংকটি ভুল হতে পারে, অথবা পোস্টটি এখনো প্রকাশ করা হয়নি।
        </p>
      </div>
    </div>
  );
}

function BlogPostPage() {
  const { post, settings } = Route.useLoaderData();
  if (!post) return null;

  return (
    <JournalShell settings={settings} reader>

      <main className="px-5">
        <article className="mx-auto max-w-2xl pt-12 sm:pt-16">
          <header className="text-center">
            {post.tags.length ? (
              <p className="journal-kicker">{post.tags.slice(0, 3).join(" • ")}</p>
            ) : null}
            <h1 className="journal-serif mt-3 text-[2.6rem] leading-[1.06] tracking-tight sm:text-6xl">
              {post.title}
            </h1>
            <div className="journal-kicker mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
              <span>{formatDate(post.published_at ?? post.updated_at)}</span>
              <span>{readingMinutes(post.body_md)} min read</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" /> {post.views}
              </span>
            </div>
          </header>

          {post.cover_path ? (
            <img
              src={mediaUrl({ path: post.cover_path, name: post.title, mime: "image/*" })}
              alt={post.title}
              className="mt-9 w-full rounded-2xl border object-cover"
            />
          ) : null}

          <div className="mt-9">
            <Markdown>{post.body_md}</Markdown>
          </div>

          {post.tags.length ? (
            <p className="journal-serif mt-12 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {post.tags.map((tag: string) => (
                <span key={tag}>#{tag}</span>
              ))}
            </p>
          ) : null}

          <div className="mt-10 border-t pt-8" />

        </article>
      </main>
    </JournalShell>
  );
}
