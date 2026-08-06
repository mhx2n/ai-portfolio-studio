import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { blogHtmlSchema } from "./html-schema";
import { colorizeMarkdown } from "@/lib/blog-color";

/** Renders raw HTML (+ markdown) safely — used by the `html` block. */
export function RawHtml({ children }: { children: string }) {
  return (
    <div className="blog-html">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, blogHtmlSchema]]}
      >
        {colorizeMarkdown(children ?? "")}
      </ReactMarkdown>
    </div>
  );
}
