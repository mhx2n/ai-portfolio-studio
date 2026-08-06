import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { blogHtmlSchema } from "./html-schema";
import { colorizeMarkdown } from "@/lib/blog-color";

/**
 * Inline-ish markdown + safe HTML renderer used for every text slot inside blocks
 * (callouts, quotes, cards, columns, banners, stats…), so markdown and colour
 * syntax work everywhere — not only inside the HTML block.
 */
export function RichText({
  children,
  className,
  as = "div",
}: {
  children: string;
  className?: string;
  as?: "div" | "span";
}) {
  const Wrapper = as;
  return (
    <Wrapper className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, blogHtmlSchema]]}
        components={{
          p: ({ children: kids }) => <span className="blog-rt-p">{kids}</span>,
          a: ({ href, children: kids }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {kids}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />
          ),
        }}
      >
        {colorizeMarkdown(children ?? "")}
      </ReactMarkdown>
    </Wrapper>
  );
}
