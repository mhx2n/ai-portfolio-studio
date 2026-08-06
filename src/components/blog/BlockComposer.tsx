import { useState } from "react";
import {
  AudioLines,
  Check,
  Columns3,
  Frame,
  Heading,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  MessageSquareQuote,
  Minus,
  MoveVertical,
  Plus,
  Send,
  Sigma,
  SquareStack,
  Table as TableIcon,
  Video,
  X,
} from "lucide-react";
import type { MediaItem } from "@/lib/portfolio-types";
import { Button } from "@/components/ui/button";
import { MediaInput } from "@/components/admin/MediaInput";

type Field = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "select" | "media";
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string;
  multiple?: boolean;
  rows?: number;
  hint?: string;
};

type BlockDef = {
  id: string;
  label: string;
  icon: typeof Video;
  desc: string;
  fields: Field[];
  build: (v: Record<string, string>) => string;
};

/** Serializes a fenced custom block: ```lang + key: value lines + optional body. */
function fence(lang: string, meta: Record<string, string>, body?: string) {
  const lines = Object.entries(meta)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value.trim()}`);
  const text = body?.trim() ? `${lines.join("\n")}\n\n${body.trim()}` : lines.join("\n");
  return `\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
}

const BLOCKS: BlockDef[] = [
  {
    id: "video",
    label: "ভিডিও",
    icon: Video,
    desc: "YouTube/Vimeo লিংক বা নিজের আপলোড করা ভিডিও",
    fields: [
      { name: "url", label: "ভিডিও লিংক", kind: "text", placeholder: "https://youtu.be/xxxxxxxx" },
      { name: "upload", label: "অথবা ভিডিও আপলোড", kind: "media", accept: "video/*" },
      { name: "caption", label: "ক্যাপশন", kind: "text", placeholder: "লাইভ অ্যাকশন" },
    ],
    build: (v) => fence("video", { url: v['upload'] || v['url'] || "", caption: v['caption'] ?? "" }),
  },
  {
    id: "audio",
    label: "অডিও",
    icon: AudioLines,
    desc: "অডিও প্লেয়ার (mp3/wav/m4a)",
    fields: [
      { name: "url", label: "অডিও লিংক", kind: "text", placeholder: "https://…/audio.mp3" },
      { name: "upload", label: "অথবা অডিও আপলোড", kind: "media", accept: "audio/*" },
      { name: "title", label: "শিরোনাম", kind: "text", placeholder: "ভয়েস নোট" },
      { name: "caption", label: "ক্যাপশন", kind: "text" },
    ],
    build: (v) =>
      fence("audio", {
        url: v['upload'] || v['url'] || "",
        title: v['title'] ?? "",
        caption: v['caption'] ?? "",
      }),
  },
  {
    id: "image",
    label: "ছবি",
    icon: ImageIcon,
    desc: "একটি ছবি + ক্যাপশন",
    fields: [
      { name: "upload", label: "ছবি আপলোড", kind: "media", accept: "image/*" },
      { name: "url", label: "অথবা ছবির লিংক", kind: "text", placeholder: "https://…/image.jpg" },
      { name: "caption", label: "ক্যাপশন", kind: "text" },
    ],
    build: (v) => `\n![${(v['caption'] ?? "").trim()}](${(v['upload'] || v['url'] || "").trim()})\n\n`,
  },
  {
    id: "gallery",
    label: "গ্যালারি",
    icon: LayoutGrid,
    desc: "একাধিক ছবি গ্রিডে",
    fields: [
      { name: "upload", label: "ছবি আপলোড (একাধিক)", kind: "media", accept: "image/*", multiple: true },
      {
        name: "urls",
        label: "অথবা লিংক (প্রতি লাইনে একটি)",
        kind: "textarea",
        rows: 3,
        placeholder: "https://…/1.jpg\nhttps://…/2.jpg",
      },
      { name: "caption", label: "ক্যাপশন", kind: "text" },
    ],
    build: (v) =>
      fence(
        "gallery",
        { caption: v['caption'] ?? "" },
        [v['upload'] ?? "", v['urls'] ?? ""].filter(Boolean).join("\n"),
      ),
  },
  {
    id: "callout",
    label: "কলআউট",
    icon: Info,
    desc: "রঙিন বর্ডারের নোট বক্স",
    fields: [
      {
        name: "type",
        label: "ধরন",
        kind: "select",
        options: [
          { value: "info", label: "তথ্য" },
          { value: "tip", label: "টিপস" },
          { value: "success", label: "সফল" },
          { value: "warn", label: "সতর্কতা" },
        ],
      },
      { name: "title", label: "শিরোনাম", kind: "text", placeholder: "নোট" },
      { name: "body", label: "লেখা", kind: "textarea", rows: 4 },
    ],
    build: (v) => fence("callout", { type: v['type'] || "info", title: v['title'] ?? "" }, v['body']),
  },
  {
    id: "quote",
    label: "কোট",
    icon: MessageSquareQuote,
    desc: "উদ্ধৃতি + লেখকের নাম",
    fields: [
      { name: "body", label: "উদ্ধৃতি", kind: "textarea", rows: 3 },
      { name: "author", label: "লেখক", kind: "text" },
    ],
    build: (v) => fence("quote", { author: v['author'] ?? "" }, v['body']),
  },
  {
    id: "table",
    label: "টেবিল",
    icon: TableIcon,
    desc: "ফিচার/তুলনার টেবিল",
    fields: [
      {
        name: "headers",
        label: "কলামের নাম (কমা দিয়ে)",
        kind: "text",
        placeholder: "ফিচার, বিবরণ",
      },
      {
        name: "rows",
        label: "সারি (প্রতি লাইনে একটি, | দিয়ে আলাদা)",
        kind: "textarea",
        rows: 4,
        placeholder: "Magic Extraction | ফাইল থেকে প্রশ্ন বের করে\nEasy Merge | সহজে ফাইল জোড়া লাগায়",
      },
    ],
    build: (v) => {
      const headers = (v['headers'] || "কলাম ১, কলাম ২")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
      const rows = (v['rows'] ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const cells = line.split("|").map((c) => c.trim());
          while (cells.length < headers.length) cells.push("");
          return `| ${cells.slice(0, headers.length).join(" | ")} |`;
        });
      return `\n| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${rows.join("\n")}\n\n`;
    },
  },
  {
    id: "stats",
    label: "স্ট্যাটস",
    icon: Sigma,
    desc: "সংখ্যা/মেট্রিক কার্ড",
    fields: [
      {
        name: "rows",
        label: "লেবেল | মান (প্রতি লাইনে একটি)",
        kind: "textarea",
        rows: 4,
        placeholder: "ইউজার | ১২K\nআপটাইম | ৯৯.৯%",
      },
    ],
    build: (v) => fence("stats", {}, v['rows']),
  },
  {
    id: "telegram",
    label: "টেলিগ্রাম",
    icon: Send,
    desc: "টেলিগ্রাম আইডির বড় CTA বাটন",
    fields: [
      { name: "id", label: "টেলিগ্রাম আইডি", kind: "text", placeholder: "@username" },
      { name: "label", label: "বাটনের লেখা", kind: "text", placeholder: "Contact via Telegram" },
    ],
    build: (v) => fence("telegram", { id: v['id'] ?? "", label: v['label'] ?? "" }),
  },
  {
    id: "embed",
    label: "এমবেড",
    icon: Frame,
    desc: "যেকোনো সাইট iframe-এ",
    fields: [
      { name: "url", label: "লিংক", kind: "text", placeholder: "https://example.com" },
      { name: "ratio", label: "অনুপাত", kind: "text", placeholder: "16 / 9" },
      { name: "caption", label: "ক্যাপশন", kind: "text" },
    ],
    build: (v) =>
      fence("embed", {
        url: v['url'] ?? "",
        ratio: v['ratio'] || "16 / 9",
        caption: v['caption'] ?? "",
      }),
  },
  {
    id: "columns",
    label: "কলাম",
    icon: Columns3,
    desc: "পাশাপাশি ২/৩ কলামে লেখা সাজানো",
    fields: [
      {
        name: "cols",
        label: "কলাম সংখ্যা",
        kind: "select",
        options: [
          { value: "2", label: "২ কলাম" },
          { value: "3", label: "৩ কলাম" },
        ],
      },
      { name: "align", label: "অ্যালাইন", kind: "select", options: ALIGN_OPTIONS },
      {
        name: "body",
        label: "প্রতিটি কলাম --- দিয়ে আলাদা করুন (প্রথম লাইনে # শিরোনাম)",
        kind: "textarea",
        rows: 6,
        placeholder: "# শিরোনাম ১\nএখানে লেখা\n---\n# শিরোনাম ২\nএখানে লেখা",
      },
    ],
    build: (v) =>
      fence("columns", { cols: v['cols'] || "2", align: v['align'] || "left" }, v['body']),
  },
  {
    id: "cards",
    label: "কার্ড গ্রিড",
    icon: SquareStack,
    desc: "টেক্সট বক্স গ্রিডে সাজানো",
    fields: [
      {
        name: "cols",
        label: "কলাম সংখ্যা",
        kind: "select",
        options: [
          { value: "2", label: "২ কলাম" },
          { value: "3", label: "৩ কলাম" },
        ],
      },
      { name: "align", label: "অ্যালাইন", kind: "select", options: ALIGN_OPTIONS },
      {
        name: "rows",
        label: "শিরোনাম | লেখা (প্রতি লাইনে একটি কার্ড)",
        kind: "textarea",
        rows: 5,
        placeholder: "ফিচার ১ | বিস্তারিত লেখা\nফিচার ২ | বিস্তারিত লেখা",
      },
    ],
    build: (v) => fence("cards", { cols: v['cols'] || "2", align: v['align'] || "left" }, v['rows']),
  },
  {
    id: "banner",
    label: "ব্যানার হেডিং",
    icon: Heading,
    desc: "বড় রঙিন হেডিং ব্যান্ড",
    fields: [
      { name: "title", label: "শিরোনাম", kind: "text", placeholder: "Add a heading" },
      { name: "subtitle", label: "সাব-টাইটেল", kind: "text" },
      {
        name: "style",
        label: "স্টাইল",
        kind: "select",
        options: [
          { value: "solid", label: "সলিড" },
          { value: "outline", label: "আউটলাইন" },
          { value: "accent", label: "অ্যাকসেন্ট" },
        ],
      },
      { name: "align", label: "অ্যালাইন", kind: "select", options: ALIGN_OPTIONS },
    ],
    build: (v) =>
      fence("banner", {
        title: v['title'] ?? "",
        subtitle: v['subtitle'] ?? "",
        style: v['style'] || "solid",
        align: v['align'] || "left",
      }),
  },
  {
    id: "divider",
    label: "ডিভাইডার",
    icon: Minus,
    desc: "সেকশন আলাদা করার লাইন",
    fields: [
      {
        name: "style",
        label: "স্টাইল",
        kind: "select",
        options: [
          { value: "line", label: "সরু লাইন" },
          { value: "dotted", label: "ডটেড" },
          { value: "thick", label: "মোটা" },
        ],
      },
    ],
    build: (v) => fence("divider", { style: v['style'] || "line" }),
  },
  {
    id: "spacer",
    label: "ফাঁকা জায়গা",
    icon: MoveVertical,
    desc: "দুই সেকশনের মাঝে ফাঁকা স্পেস",
    fields: [
      { name: "height", label: "উচ্চতা (px)", kind: "text", placeholder: "48" },
    ],
    build: (v) => fence("spacer", { height: v['height'] || "48" }),
  },
];

export function BlockComposer({
  userId,
  onInsert,
}: {
  userId?: string;
  onInsert: (markdown: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const active = BLOCKS.find((b) => b.id === openId) ?? null;

  function open(def: BlockDef) {
    setOpenId(def.id);
    setValues(
      Object.fromEntries(
        def.fields.map((f) => [f.name, f.kind === "select" ? (f.options?.[0]?.value ?? "") : ""]),
      ),
    );
  }

  function set(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function commit() {
    if (!active) return;
    onInsert(active.build(values));
    setOpenId(null);
    setValues({});
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {BLOCKS.map((def) => (
          <button
            key={def.id}
            type="button"
            onClick={() => (openId === def.id ? setOpenId(null) : open(def))}
            className={`flex items-center gap-2 rounded-xl border bg-background/70 px-2.5 py-2 text-left text-xs transition-[transform,background-color,border-color] duration-150 will-change-transform hover:-translate-y-px hover:bg-secondary active:translate-y-0 ${
              openId === def.id ? "border-primary bg-secondary" : ""
            }`}
          >
            <def.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-medium">{def.label}</span>
            <Plus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        ))}
      </div>

      {active ? (
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-secondary/40 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{active.label} সেকশন</p>
              <p className="text-[11px] text-muted-foreground">{active.desc}</p>
            </div>
            <button
              type="button"
              aria-label="বন্ধ করুন"
              onClick={() => setOpenId(null)}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {active.fields.map((field) => (
              <div
                key={field.name}
                className={field.kind === "textarea" || field.kind === "media" ? "sm:col-span-2" : ""}
              >
                <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{field.label}</p>
                {field.kind === "text" ? (
                  <input
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                ) : null}
                {field.kind === "textarea" ? (
                  <textarea
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    rows={field.rows ?? 3}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                ) : null}
                {field.kind === "select" ? (
                  <select
                    value={values[field.name] ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                {field.kind === "media" ? (
                  userId ? (
                    <MediaInput
                      userId={userId}
                      {...(field.accept ? { accept: field.accept } : {})}
                      multiple={field.multiple ?? false}
                      label="ফাইল বাছুন"
                      value={parsePaths(values[field.name] ?? "")}
                      onChange={(items: MediaItem[]) =>
                        set(field.name, items.map((i) => i.path).join("\n"))
                      }
                    />
                  ) : (
                    <p className="text-[11px] text-muted-foreground">আপলোডের জন্য লগইন দরকার।</p>
                  )
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpenId(null)}>
              বাতিল
            </Button>
            <Button size="sm" onClick={commit}>
              <Check className="size-4" /> সেকশন সেভ করুন
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Rehydrates MediaInput items from the newline-joined storage paths we keep in state. */
function parsePaths(value: string): MediaItem[] {
  return value
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((path) => ({
      path,
      name: path.split("/").pop() ?? path,
      mime: /\.(png|jpe?g|webp|gif|avif)$/i.test(path) ? "image/*" : "application/octet-stream",
    }));
}
