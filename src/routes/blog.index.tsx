import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { getBlogIndex } from "@/lib/blog.functions";
import { fontStack, formatDate } from "@/lib/blog-types";
import { mediaUrl } from "@/lib/portfolio-types";

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
    <main
      className="min-h-screen px-5 py-10"
      style={
        {
          "--blog-accent": settings.accent,
          fontFamily: fontStack(settings.font),
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> হোম
        </Link>

        <header className="mt-6 border-b pb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{settings.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {settings.description}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">এখনো কোনো পোস্ট প্রকাশ করা হয়নি।</p>
        ) : featured ? (
          <>
            <PostFeature post={featured} />
            <div className="mt-6">
              <PostList posts={rest} layout="list" />
            </div>
          </>
        ) : (
          <PostList posts={posts} layout={settings.layout} />
        )}
      </div>
    </main>
  );
}

type Card = ReturnType<typeof Route.useLoaderData>["posts"][number];

function PostFeature({ post }: { post: Card }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="glass mt-8 block overflow-hidden rounded-3xl transition-transform hover:-translate-y-0.5"
    >
      {post.cover_path ? (
        <img
          src={mediaUrl({ path: post.cover_path, name: post.title, mime: "image/*" })}
          alt={post.title}
          loading="lazy"
          className="h-52 w-full object-cover"
        />
      ) : null}
      <div className="p-6">
        <p className="text-[11px] uppercase tracking-widest text-[color:var(--blog-accent)]">
          ফিচার্ড
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{post.title}</h2>
        {post.excerpt ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}
        <Meta post={post} />
      </div>
    </Link>
  );
}

function PostList({ posts, layout }: { posts: Card[]; layout: string }) {
  if (layout === "cards") {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="glass block overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5"
          >
            {post.cover_path ? (
              <img
                src={mediaUrl({ path: post.cover_path, name: post.title, mime: "image/*" })}
                alt={post.title}
                loading="lazy"
                className="h-36 w-full object-cover"
              />
            ) : null}
            <div className="p-4">
              <h2 className="font-semibold tracking-tight">{post.title}</h2>
              {post.excerpt ? (
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              ) : null}
              <Meta post={post} />
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-4 divide-y">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="group flex flex-col gap-1 py-5 transition-colors"
          >
            <h2 className="text-lg font-semibold tracking-tight group-hover:text-[color:var(--blog-accent)]">
              {post.title}
            </h2>
            {post.excerpt ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
            ) : null}
            <Meta post={post} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Meta({ post }: { post: Card }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span>{formatDate(post.published_at ?? post.updated_at)}</span>
      <span className="inline-flex items-center gap-1">
        <Eye className="size-3" /> {post.views}
      </span>
      {post.tags.slice(0, 3).map((tag) => (
        <span key={tag} className="rounded-full bg-secondary px-2 py-0.5">
          #{tag}
        </span>
      ))}
    </div>
  );
}
