import {
  Bold,
  Italic,
  Heading2,
  List,
  Link2,
  Code2,
  Table as TableIcon,
  Image as ImageIcon,
  Video,
  AudioLines,
  MessageSquareQuote,
  Info,
  Send,
  LayoutGrid,
  Sigma,
  Frame,
} from "lucide-react";

type Snippet = { label: string; icon: typeof Bold; text: string };

const INLINE: Snippet[] = [
  { label: "বোল্ড", icon: Bold, text: "**টেক্সট**" },
  { label: "ইটালিক", icon: Italic, text: "_টেক্সট_" },
  { label: "হেডিং", icon: Heading2, text: "\n## হেডিং\n" },
  { label: "লিস্ট", icon: List, text: "\n- আইটেম ১\n- আইটেম ২\n" },
  { label: "লিংক", icon: Link2, text: "[লেখা](https://example.com)" },
  { label: "কোড", icon: Code2, text: "\n```js\nconsole.log(1)\n```\n" },
  {
    label: "টেবিল",
    icon: TableIcon,
    text: "\n| ফিচার | বিবরণ |\n| --- | --- |\n| নাম | বিস্তারিত |\n",
  },
  { label: "ছবি", icon: ImageIcon, text: "\n![ক্যাপশন](https://example.com/image.jpg)\n" },
];

const BLOCKS: Snippet[] = [
  // moved into BlockComposer (form-based sections)
  {
    label: "ভিডিও",
    icon: Video,
    text: "\n```video\nurl: https://youtu.be/xxxxxxxx\ncaption: লাইভ অ্যাকশন\n```\n",
  },
  {
    label: "অডিও",
    icon: AudioLines,
    text: "\n```audio\nurl: https://example.com/audio.mp3\ntitle: ভয়েস নোট\n```\n",
  },
  {
    label: "কলআউট",
    icon: Info,
    text: "\n```callout\ntype: info\ntitle: নোট\n\nএখানে গুরুত্বপূর্ণ তথ্য লিখুন।\n```\n",
  },
  {
    label: "কোট",
    icon: MessageSquareQuote,
    text: "\n```quote\nauthor: নাম\n\nউদ্ধৃতি এখানে।\n```\n",
  },
  {
    label: "টেলিগ্রাম",
    icon: Send,
    text: "\n```telegram\nid: @username\nlabel: Contact via Telegram\n```\n",
  },
  {
    label: "গ্যালারি",
    icon: LayoutGrid,
    text: "\n```gallery\ncaption: স্ক্রিনশট\n\nhttps://example.com/1.jpg\nhttps://example.com/2.jpg\n```\n",
  },
  {
    label: "স্ট্যাটস",
    icon: Sigma,
    text: "\n```stats\nইউজার | ১২K\nআপটাইম | ৯৯.৯%\n```\n",
  },
  {
    label: "এমবেড",
    icon: Frame,
    text: "\n```embed\nurl: https://example.com\nratio: 16 / 9\n```\n",
  },
];

export function MarkdownToolbar({ onInsert }: { onInsert: (text: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {INLINE.map((s) => (
        <button
          key={s.label}
          type="button"
          title={s.label}
          onClick={() => onInsert(s.text)}
          className="inline-flex items-center gap-1 rounded-lg border bg-background/70 px-2 py-1 text-[11px] text-muted-foreground transition-[transform,color,background-color] duration-150 will-change-transform hover:-translate-y-px hover:bg-secondary hover:text-foreground active:translate-y-0"
        >
          <s.icon className="size-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
