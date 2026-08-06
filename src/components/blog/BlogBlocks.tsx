import { useMemo } from "react";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Send,
  Quote,
  ExternalLink,
  Star,
  Heart,
  Flame,
  Rocket,
  Bell,
  MapPin,
  Link as LinkIcon,
  Download,
  Play,
  Sparkle,
} from "lucide-react";
import { mediaUrl } from "@/lib/portfolio-types";
import { RawHtml } from "./RawHtml";
import { RichText } from "./RichText";

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
  "columns",
  "cards",
  "banner",
  "divider",
  "spacer",
  "html",
] as const;

export type BlockLang = (typeof BLOG_BLOCK_LANGS)[number];

export function isBlockLang(value: string): value is BlockLang {
  return (BLOG_BLOCK_LANGS as readonly string[]).includes(value);
}

/** Parses simple `key: value` lines; everything after a blank line is free text. */
function parseBlock(raw: string) {
  const map = new Map<string, string>();
  const rest: string[] = [];
  let inBody = false;
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    if (inBody) {
      rest.push(line);
      continue;
    }
    if (!line.trim()) {
      if (map.size) inBody = true;
      continue;
    }
    const match = /^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (match && match[1] !== undefined) map.set(match[1].toLowerCase(), (match[2] ?? "").trim());
    else {
      inBody = true;
      rest.push(line);
    }
  }
  const get = (key: string, fallback = "") => map.get(key) ?? fallback;
  return { get, body: rest.join("\n").trim() };
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
  if (yt?.[1]) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function Frame({
  caption,
  captionPos,
  captionSize,
  size,
  children,
}: {
  caption: string;
  captionPos: string;
  captionSize?: string;
  size: string;
  children: React.ReactNode;
}) {
  const cap = caption ? (
    <figcaption className="blog-caption" data-cap={captionSize || "md"}>
      <RichText as="div">{caption}</RichText>
    </figcaption>
  ) : null;
  return (
    <figure className="blog-block" data-size={size}>
      {captionPos === "top" ? cap : null}
      {children}
      {captionPos === "top" ? null : cap}
    </figure>
  );
}

const CALLOUT_ICONS: Record<string, typeof Info> = {
  info: Info,
  tip: Lightbulb,
  success: CheckCircle2,
  warn: AlertTriangle,
};

/** Optional decorative icons authors can pick per block. */
const PICK_ICONS: Record<string, typeof Info> = {
  info: Info,
  tip: Lightbulb,
  success: CheckCircle2,
  warn: AlertTriangle,
  star: Star,
  heart: Heart,
  flame: Flame,
  rocket: Rocket,
  bell: Bell,
  pin: MapPin,
  link: LinkIcon,
  download: Download,
  play: Play,
  sparkle: Sparkle,
};

/** Wraps a block so author-chosen width, float side, nudge and tilt apply to any block. */
export function BlogBlock({ lang, source }: { lang: BlockLang; source: string }) {
  const num = (key: string, min: number, max: number, fallback: number) => {
    const raw = Number(new RegExp(`^[ \\t]*${key}[ \\t]*:[ \\t]*(-?\\d+)`, "im").exec(source)?.[1]);
    return Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : fallback;
  };
  const w = num("width", 30, 100, 100);
  const x = num("x", -40, 40, 0);
  const y = num("y", -120, 120, 0);
  const rotate = num("rotate", -12, 12, 0);
  const floatRaw = /^[ \t]*float[ \t]*:[ \t]*(left|right)/im.exec(source)?.[1];
  const side = floatRaw === "left" || floatRaw === "right" ? floatRaw : "none";
  const inner = <BlockBody lang={lang} source={source} />;
  if (w >= 100 && !x && !y && !rotate && side === "none") return inner;
  const transform = [
    x ? `translateX(${x}%)` : "",
    y ? `translateY(${y}px)` : "",
    rotate ? `rotate(${rotate}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className="blog-place"
      data-float={side}
      style={{ width: w >= 100 ? undefined : `${w}%`, ...(transform ? { transform } : {}) }}
    >
      {inner}
    </div>
  );
}

function BlockBody({ lang, source }: { lang: BlockLang; source: string }) {
  const { get, body } = useMemo(() => parseBlock(source), [source]);
  const caption = get("caption");
  const size = get("size", "full");
  const align = get("align", "left");
  const captionPos = get("caption_pos", "bottom");
  const captionSize = get("caption_size", "md").toLowerCase();

  if (lang === "html") {
    const html = source.replace(/^\s*(?:[a-z_][\w-]*\s*:\s*.*\n)*\s*/i, "") || source;
    return <RawHtml>{html.trim() ? html : source}</RawHtml>;
  }

  const pickedIcon = PICK_ICONS[get("icon").toLowerCase()];
  const Figure = (props: { caption: string; children: React.ReactNode }) => (
    <Frame caption={props.caption} captionPos={captionPos} captionSize={captionSize} size={size}>
      {props.children}
    </Frame>
  );

  if (lang === "video") {
    const src = get("url") || get("src") || body;
    if (!src) return null;
    const iframe = isSafeHttp(src) ? embedUrl(src) : null;
    const poster = get("poster");
    return (
      <Figure caption={caption}>
        <div className="blog-frame">
          {iframe ? (
            <iframe
              src={iframe}
              title={caption || "video"}
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
              {...(poster ? { poster: resolveSrc(poster) } : {})}
            />
          )}
        </div>
      </Figure>
    );
  }

  if (lang === "audio") {
    const src = get("url") || get("src") || body;
    if (!src) return null;
    const title = get("title");
    return (
      <Figure caption={caption}>
        <div className="blog-audio">
          {title ? <RichText as="div" className="blog-audio-title">{title}</RichText> : null}
          <audio src={resolveSrc(src)} controls preload="metadata" />
        </div>
      </Figure>
    );
  }

  if (lang === "embed") {
    const src = get("url") || get("src") || body;
    if (!isSafeHttp(src)) return null;
    return (
      <Figure caption={caption}>
        <div className="blog-frame" style={{ aspectRatio: get("ratio", "16 / 9") }}>
          <iframe src={src} title={caption || "embed"} loading="lazy" allowFullScreen />
        </div>
      </Figure>
    );
  }

  if (lang === "callout" || lang === "info") {
    const kind = get("type", "info").toLowerCase();
    const Icon = pickedIcon ?? CALLOUT_ICONS[kind] ?? Info;
    const title = get("title");
    return (
      <aside
        className={`blog-callout blog-callout-${CALLOUT_ICONS[kind] ? kind : "info"}`}
        data-size={size}
      >
        <Icon className="blog-callout-icon" aria-hidden />
        <div>
          {title ? <RichText className="blog-callout-title">{title}</RichText> : null}
          <RichText className="blog-callout-body">{body || get("text")}</RichText>
        </div>
      </aside>
    );
  }

  if (lang === "quote") {
    const author = get("author");
    const Icon = pickedIcon ?? Quote;
    return (
      <blockquote className="blog-quote" data-size={size}>
        <Icon className="blog-quote-icon" aria-hidden />
        <RichText>{body || get("text")}</RichText>
        {author ? <cite>— {author}</cite> : null}
      </blockquote>
    );
  }

  if (lang === "button" || lang === "telegram") {
    const isTg = lang === "telegram";
    const handle = (get("id") || get("username")).replace(/^@/, "");
    const href = isTg ? (handle ? `https://t.me/${handle}` : get("url")) : get("url") || body;
    if (!isSafeHttp(href)) return null;
    const label = get("label") || (isTg ? `@${handle || "telegram"}` : href);
    return (
      <p className="blog-cta-wrap" data-size={size}>
        <a
          className={`blog-cta ${isTg ? "blog-cta-tg" : ""}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {(() => {
            const Icon = pickedIcon ?? (isTg ? Send : ExternalLink);
            return <Icon className="size-4" aria-hidden />;
          })()}

          <RichText as="span">{label}</RichText>
        </a>
      </p>
    );
  }

  if (lang === "gallery") {
    const items = (body || get("images"))
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return null;
    return (
      <Figure caption={caption}>
        <div className="blog-gallery" data-cols={items.length === 1 ? "1" : "2"}>
          {items.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={resolveSrc(src)}
              alt={caption || `ছবি ${i + 1}`}
              loading="lazy"
            />
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
      <div className="blog-stats" data-size={size}>
        {rows.map((parts, i) => (
          <div key={i} className="blog-stat">
            <RichText as="span" className="blog-stat-value">{parts[1] ?? ""}</RichText>
            <RichText as="span" className="blog-stat-label">{parts[0] ?? ""}</RichText>
          </div>
        ))}
      </div>
    );
  }

  if (lang === "columns") {
    const parts = body
      .split(/^\s*---\s*$/m)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return null;
    const cols = Math.min(3, Math.max(1, Number(get("cols", "2")) || 2));
    return (
      <div className="blog-cols" data-cols={String(cols)} data-size={size} data-align={align}>
        {parts.map((part, i) => {
          const [first, ...rest] = part.split("\n");
          const hasTitle = /^#+\s/.test(first ?? "");
          return (
            <div key={i} className="blog-col">
              {hasTitle ? (
                <RichText className="blog-col-title">{(first ?? "").replace(/^#+\s*/, "")}</RichText>
              ) : null}
              <RichText className="blog-col-body">{(hasTitle ? rest.join("\n") : part).trim()}</RichText>
            </div>
          );
        })}
      </div>
    );
  }

  if (lang === "cards") {
    const rows = body
      .split("\n")
      .map((line) => line.split("|").map((s) => s.trim()))
      .filter((parts) => parts[0]);
    if (!rows.length) return null;
    const cols = Math.min(3, Math.max(1, Number(get("cols", "2")) || 2));
    return (
      <div className="blog-cards" data-cols={String(cols)} data-size={size} data-align={align}>
        {rows.map((parts, i) => (
          <div key={i} className="blog-card">
            <RichText className="blog-card-title">{parts[0] ?? ""}</RichText>
            {parts[1] ? <RichText className="blog-card-body">{parts[1]}</RichText> : null}
          </div>
        ))}
      </div>
    );
  }

  if (lang === "banner") {
    const title = get("title") || body;
    if (!title.trim()) return null;
    const Icon = pickedIcon;
    return (
      <div
        className={`blog-banner blog-banner-${get("style", "solid")}`}
        data-size={size}
        data-align={align}
      >
        {Icon ? <Icon className="blog-banner-icon" aria-hidden /> : null}
        <RichText className="blog-banner-title">{title}</RichText>
        {get("subtitle") ? <RichText className="blog-banner-sub">{get("subtitle")}</RichText> : null}
      </div>
    );
  }

  if (lang === "divider") {
    return <hr className={`blog-divider blog-divider-${get("style", "line")}`} data-size={size} />;
  }

  if (lang === "spacer") {
    const h = Math.min(240, Math.max(8, Number(get("height", "48")) || 48));
    return <div className="blog-spacer" style={{ height: `${h}px` }} aria-hidden />;
  }

  return null;
}
