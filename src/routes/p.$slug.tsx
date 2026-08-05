import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublicPortfolio } from "@/lib/portfolio.functions";
import { PortfolioView } from "@/components/portfolio/PortfolioView";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const portfolio = await getPublicPortfolio({ data: { slug: params.slug } });
    if (!portfolio) throw notFound();
    return { portfolio };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "পোর্টফোলিও পাওয়া যায়নি" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { title, tagline } = loaderData.portfolio;
    const description = tagline ?? `${title} — একটি শেয়ারেবল পোর্টফোলিও।`;
    return {
      meta: [
        { title: `${title} — Portfolio` },
        { name: "description", content: description },
        { property: "og:title", content: `${title} — Portfolio` },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PortfolioNotFound,
  component: PublicPortfolioPage,
});

function PortfolioNotFound() {
  return (
    <div className="grid-glow flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">পোর্টফোলিও পাওয়া যায়নি</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          লিংকটি ভুল হতে পারে, অথবা এটি এখনো প্রকাশ করা হয়নি।
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}

function PublicPortfolioPage() {
  const { portfolio } = Route.useLoaderData();
  return (
    <PortfolioView
      title={portfolio.title}
      tagline={portfolio.tagline}
      theme={portfolio.theme}
      content={portfolio.content}
    />
  );
}
