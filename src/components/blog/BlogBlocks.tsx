import { useMemo } from "react";
import { Info, AlertTriangle, CheckCircle2, Lightbulb, Send, Quote, ExternalLink } from "lucide-react";
import { mediaUrl } from "@/lib/portfolio-types";

/** Known custom block languages usable as ```name fences inside post markdown. */
export const BLOG_BLOCK_LANGS = [
  "video",
  "audio",
  "embed",
  "callout",
  "quote",
  "button",
  "telegram",
  "gallery",
  "info",
  "stats",
] as const;

export type BlockLang = (typeof BLOG_BLOCK_LANGS)[number];

export function isBlockLang(value: string): value is BlockLang {
  return (BLOG_BLOCK_LANGS as readonly string[]).includes(value);
}

/** Parses simple `key: value` lines; everything after a blank line is free text. */
function parseBlock(raw: string) {
  const fields: Record<string, string> = {};
  const rest: string[] = [];
  let inBody = false;
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    if (inBody) {
      rest.push(line);
      continue;
    }
    if (!line.trim()) {
      if (Object.keys(fields).length) inBody = true;
      continue;
    }
    const match = /^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (match) fields[match[1].toLowerCase()] = match[2].trim();
    else {
      inBody = true;
      rest.push(line);
    }
  }
  return { fields, body: rest.join("\n").trim() };
}

function isSafeHttp(url: string) {
  return /^https?:\/\//i.test(url);
}

/** Storage paths get proxied; absolute http(s) links pass through. */
function resolveSrc(value: string) {
  if (!value) return "";
  if (isSafeHttp(value)) return value;
  if (value.startsWith("/")) return value;
  return mediaUrl({ path: value, name: "media", mime: "application/octet-stream" });
}

function embedUrl(url: string): string | null {
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function Figure({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <figure className="blog-block">
      {children}
      {caption ? <figcaption className="blog-caption">{caption}</figcaption> : null}
    </figure>
  );
}

const CALLOUT_ICONS = {
  info: Info,
  tip: Lightbulb,
  success: CheckCircle2,
  warn: AlertTriangle,
} as const;

export function BlogBlock({ lang, source }: { lang: BlockLang; source: string }) {
  const { fields, body } = useMemo(() => parseBlock(source), [source]);

  if (lang === "video") {
    const src = fields.url ?? fields.src ?? body;
    const iframe = isSafeHttp(src) ? embedUrl(src) : null;
    if (!src) return null;
    return (
      <Figure caption={fields.caption}>
        <div className="blog-frame">
          {iframe ? (
            <iframe
              src={iframe}
              title={fields.caption || "video"}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={resolveSrc(src)}
              controls
              playsInline
              preload="metadata"
              poster={fields.poster ? resolveSrc(fields.poster) : undefined}
            />
          )}
        </div>
      </Figure>
    );
  }

  if (lang === "audio") {
    const src = fields.url ?? fields.src ?? body;
    if (!src) return null;
    return (
      <Figure caption={fields.caption}>
        <div className="blog-audio">
          {fields.title ? <p className="blog-audio-title">{fields.title}</p> : null}
          <audio src={resolveSrc(src)} controls preload="metadata" />
        </div>
      </Figure>
    );
  }

  if (lang === "embed") {
    const src = fields.url ?? fields.src ?? body;
    if (!isSafeHttp(src)) return null;
    return (
      <Figure caption={fields.caption}>
        <div className="blog-frame" style={{ aspectRatio: fields.ratio || "16 / 9" }}>
          <iframe src={src} title={fields.caption || "embed"} loading="lazy" allowFullScreen />
        </div>
      </Figure>
    );
  }

  if (lang === "callout" || lang === "info") {
    const kind = (fields.type ?? "info").toLowerCase() as keyof typeof CALLOUT_ICONS;
    const Icon = CALLOUT_ICONS[kind] ?? Info;
    return (
      <aside className={`blog-callout blog-callout-${CALLOUT_ICONS[kind] ? kind : "info"}`}>
        <Icon className="blog-callout-icon" aria-hidden />
        <div>
          {fields.title ? <p className="blog-callout-title">{fields.title}</p> : null}
          <p className="blog-callout-body">{body || fields.text || ""}</p>
        </div>
      </aside>
    );
  }

  if (lang === "quote") {
    return (
      <blockquote className="blog-quote">
        <Quote className="blog-quote-icon" aria-hidden />
        <p>{body || fields.text || ""}</p>
        {fields.author ? <cite>— {fields.author}</cite> : null}
      </blockquote>
    );
  }

  if (lang === "button" || lang === "telegram") {
    const isTg = lang === "telegram";
    const handle = (fields.id ?? fields.username ?? "").replace(/^@/, "");
    const href = isTg
      ? handle
        ? `https://t.me/${handle}`
        : (fields.url ?? "")
      : (fields.url ?? body);
    if (!isSafeHttp(href)) return null;
    const label = fields.label ?? (isTg ? `@${handle || "telegram"}` : href);
    return (
      <p className="blog-cta-wrap">
        <a
          className={`blog-cta ${isTg ? "blog-cta-tg" : ""}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {isTg ? <Send className="size-4" aria-hidden /> : <ExternalLink className="size-4" aria-hidden />}
          {label}
        </a>
      </p>
    );
  }

  if (lang === "gallery") {
    const items = (body || fields.images || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return null;
    return (
      <Figure caption={fields.caption}>
        <div className="blog-gallery" data-cols={items.length === 1 ? "1" : "2"}>
          {items.map((src, i) => (
            <img key={`${src}-${i}`} src={resolveSrc(src)} alt={fields.caption || `ছবি ${i + 1}`} loading="lazy" />
          ))}
        </div>
      </Figure>
    );
  }

  if (lang === "stats") {
    const rows = body
      .split("\n")
      .map((line) => line.split("|").map((s) => s.trim()))
      .filter((parts) => parts[0]);
    if (!rows.length) return null;
    return (
      <div className="blog-stats">
        {rows.map((parts, i) => (
          <div key={i} className="blog-stat">
            <span className="blog-stat-value">{parts[1] ?? ""}</span>
            <span className="blog-stat-label">{parts[0]}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
