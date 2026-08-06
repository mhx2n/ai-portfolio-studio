/** Segment model for the visual block canvas. body_md stays the source of truth. */
export type BlockSize = "sm" | "md" | "full";

export type CanvasBlock = {
  /** Stable id for React keys + drag state (not persisted). */
  uid: string;
  /** Fence language, or null for plain markdown text. */
  lang: string | null;
  /** Raw inner content (fence body, or the markdown text itself). */
  source: string;
};

let counter = 0;
function uid() {
  counter += 1;
  return `b${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeBlock(lang: string | null, source: string): CanvasBlock {
  return { uid: uid(), lang, source };
}

/** Splits markdown into fenced custom blocks and text groups. */
export function parseBlocks(md: string): CanvasBlock[] {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: CanvasBlock[] = [];
  let text: string[] = [];

  const flushText = () => {
    const joined = text.join("\n").trim();
    if (joined) blocks.push(makeBlock(null, joined));
    text = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const open = /^```([\w-]*)\s*$/.exec(line.trim());
    if (open) {
      flushText();
      const lang = open[1] || "code";
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test((lines[i] ?? "").trim())) {
        body.push(lines[i] ?? "");
        i += 1;
      }
      blocks.push(makeBlock(lang, body.join("\n")));
      continue;
    }
    if (!line.trim()) {
      flushText();
      continue;
    }
    text.push(line);
  }
  flushText();
  return blocks;
}

/** Renders one block back to markdown. */
export function blockToMarkdown(block: CanvasBlock) {
  if (!block.lang) return block.source.trim();
  return `\`\`\`${block.lang}\n${block.source.replace(/\s+$/, "")}\n\`\`\``;
}

export function serializeBlocks(blocks: CanvasBlock[]) {
  return blocks
    .map(blockToMarkdown)
    .filter((s) => s.trim())
    .join("\n\n")
    .concat("\n");
}

/** Reads the `size:` meta key of a fenced block. */
export function readSize(source: string): BlockSize {
  const match = /^[ \t]*size[ \t]*:[ \t]*(sm|md|full)[ \t]*$/im.exec(source);
  return (match?.[1] as BlockSize | undefined) ?? "full";
}

/** Sets/removes the `size:` meta key without touching the rest of the block. */
export function writeSize(source: string, size: BlockSize) {
  const stripped = source
    .replace(/^[ \t]*size[ \t]*:[ \t]*[\w-]*[ \t]*\n?/gim, "")
    .replace(/^\n+/, "");
  if (size === "full") return stripped;
  return `size: ${size}\n${stripped}`;
}

/** Blocks whose visual width can be changed. */
export const SIZEABLE_LANGS = [
  "video",
  "audio",
  "embed",
  "gallery",
  "stats",
  "quote",
  "callout",
  "info",
  "button",
  "telegram",
  "columns",
  "cards",
  "banner",
];

/** Alignment meta key (`align:`). */
export type BlockAlign = "left" | "center" | "right";

export const ALIGNABLE_LANGS = ["columns", "cards", "banner"];

export function canAlign(lang: string | null) {
  return !!lang && ALIGNABLE_LANGS.includes(lang);
}

export function readAlign(source: string): BlockAlign {
  const match = /^[ \t]*align[ \t]*:[ \t]*(left|center|right)[ \t]*$/im.exec(source);
  return (match?.[1] as BlockAlign | undefined) ?? "left";
}

export function writeAlign(source: string, align: BlockAlign) {
  const stripped = source
    .replace(/^[ \t]*align[ \t]*:[ \t]*[\w-]*[ \t]*\n?/gim, "")
    .replace(/^\n+/, "");
  if (align === "left") return stripped;
  return `align: ${align}\n${stripped}`;
}

export function canResize(lang: string | null) {
  return !!lang && SIZEABLE_LANGS.includes(lang);
}

const LABELS: Record<string, string> = {
  video: "ভিডিও",
  audio: "অডিও",
  embed: "এমবেড",
  gallery: "গ্যালারি",
  stats: "স্ট্যাটস",
  quote: "কোট",
  callout: "কলআউট",
  info: "কলআউট",
  button: "বাটন",
  telegram: "টেলিগ্রাম CTA",
  code: "কোড",
  columns: "কলাম",
  cards: "কার্ড গ্রিড",
  banner: "ব্যানার হেডিং",
  divider: "ডিভাইডার",
  spacer: "ফাঁকা জায়গা",
};

export function blockLabel(block: CanvasBlock) {
  if (!block.lang) {
    const first = block.source.split("\n")[0] ?? "";
    if (/^#{1,6}\s/.test(first)) return "হেডিং";
    if (/^([-*+]|\d+\.)\s/.test(first)) return "লিস্ট";
    if (/^\|/.test(first)) return "টেবিল";
    return "টেক্সট";
  }
  return LABELS[block.lang] ?? block.lang;
}

/** Short preview line for the collapsed card. */
export function blockSummary(block: CanvasBlock) {
  const flat = block.source
    .split("\n")
    .map((l) => l.replace(/^[a-z_][\w-]*\s*:\s*/i, "").trim())
    .filter(Boolean)
    .join(" · ");
  return flat.slice(0, 90);
}

/* ---------- Generic meta helpers (key: value lines at the top of a fence) ---------- */

export function readMeta(source: string, key: string): string {
  const re = new RegExp(`^[ \\t]*${key}[ \\t]*:[ \\t]*(.*)$`, "im");
  return (re.exec(source)?.[1] ?? "").trim();
}

export function writeMeta(source: string, key: string, value: string): string {
  const re = new RegExp(`^[ \\t]*${key}[ \\t]*:[ \\t]*.*\\n?`, "gim");
  const stripped = source.replace(re, "").replace(/^\n+/, "");
  if (!value.trim()) return stripped;
  return `${key}: ${value.trim()}\n${stripped}`;
}

/** Author-chosen width in percent (30–100). 100 = full. */
export function readWidth(source: string): number {
  const raw = Number(readMeta(source, "width"));
  if (!Number.isFinite(raw) || raw <= 0) return 100;
  return Math.min(100, Math.max(30, Math.round(raw)));
}

export function writeWidth(source: string, width: number): string {
  const w = Math.min(100, Math.max(30, Math.round(width)));
  return writeMeta(source, "width", w >= 100 ? "" : String(w));
}

/** Caption placement: above or below the block. */
export type CaptionPos = "top" | "bottom";

export function readCaptionPos(source: string): CaptionPos {
  return readMeta(source, "caption_pos") === "top" ? "top" : "bottom";
}

export function writeCaptionPos(source: string, pos: CaptionPos): string {
  return writeMeta(source, "caption_pos", pos === "top" ? "top" : "");
}

/** Blocks that support a caption line. */
export const CAPTIONABLE_LANGS = ["video", "audio", "embed", "gallery"];
export function canCaption(lang: string | null) {
  return !!lang && CAPTIONABLE_LANGS.includes(lang);
}

/** Icon picker: names understood by BlogBlocks. */
export const BLOCK_ICONS = [
  "none",
  "info",
  "tip",
  "success",
  "warn",
  "star",
  "heart",
  "flame",
  "rocket",
  "bell",
  "pin",
  "link",
  "download",
  "play",
  "sparkle",
] as const;
export type BlockIcon = (typeof BLOCK_ICONS)[number];

export const ICONABLE_LANGS = ["callout", "info", "banner", "button", "telegram", "quote", "cards"];
export function canIcon(lang: string | null) {
  return !!lang && ICONABLE_LANGS.includes(lang);
}

export function readIcon(source: string): BlockIcon {
  const value = readMeta(source, "icon").toLowerCase();
  return (BLOCK_ICONS as readonly string[]).includes(value) ? (value as BlockIcon) : "none";
}

export function writeIcon(source: string, icon: BlockIcon): string {
  return writeMeta(source, "icon", icon === "none" ? "" : icon);
}

/** Caption text of a block. */
export function readCaption(source: string) {
  return readMeta(source, "caption");
}
export function writeCaption(source: string, caption: string) {
  return writeMeta(source, "caption", caption);
}
