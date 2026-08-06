import { isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import "highlight.js/styles/github-dark.css";
import { BlogBlock, isBlockLang } from "./BlogBlocks";
import { blogHtmlSchema } from "./html-schema";

/** Flattens any nested React children (e.g. syntax-highlight spans) back to plain text. */
function toText(node: React.ReactNode): string {
  if (node === null || node === undefined || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return toText(props.children);
  }
  return "";
}

/** Pulls the fence language + raw text out of a <pre><code> pair. */
function readFence(children: React.ReactNode) {
  if (!isValidElement(children)) return null;
  const props = children.props as { className?: string; children?: React.ReactNode };
  const lang = /language-([\w-]+)/.exec(props.className ?? "")?.[1];
  if (!lang) return null;
  return { lang, text: toText(props.children) };
}


/** Read-only markdown renderer with sanitized raw HTML support. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-blog">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, blogHtmlSchema], rehypeHighlight]}
        components={{
          pre: ({ children: kids, ...rest }) => {
            const fence = readFence(kids);
            if (fence && isBlockLang(fence.lang)) {
              return <BlogBlock lang={fence.lang} source={fence.text} />;
            }
            return <pre {...rest}>{kids}</pre>;
          },
          table: ({ children: kids }) => (
            <div className="blog-table-wrap">
              <table>{kids}</table>
            </div>
          ),
          img: ({ src, alt }) => (
            <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" decoding="async" />
          ),
          a: ({ href, children: kids }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {kids}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
