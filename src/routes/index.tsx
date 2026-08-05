import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Film,
  AudioLines,
  FileText,
  MapPin,
  Link2,
  ShieldCheck,
  Palette,
  Share2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Folio Studio — AI দিয়ে মাল্টিমিডিয়া পোর্টফোলিও বানান" },
      {
        name: "description",
        content:
          "আলাদা অ্যাডমিন প্যানেল থেকে কাস্টমাইজ পোর্টফোলিও বানান — AI লেখা, ভিডিও, অডিও, ফাইল, লোকেশন। প্রকাশ করলেই পাবেন শেয়ারেবল পাবলিক লিংক।",
      },
      { property: "og:title", content: "Folio Studio — AI পোর্টফোলিও বিল্ডার" },
      {
        property: "og:description",
        content: "মাল্টিমিডিয়া পোর্টফোলিও বানিয়ে এক লিংকে শেয়ার করুন। দর্শকরা শুধু দেখতে পারবে।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "AI কপিরাইটিং", body: "হিরো, About, প্রজেক্ট বর্ণনা — এক ক্লিকে AI লিখে দেবে।" },
  { icon: Film, title: "ভিডিও", body: "ফাইল আপলোড করুন বা YouTube/Vimeo লিংক এমবেড করুন।" },
  { icon: AudioLines, title: "অডিও", body: "ভয়েস ইন্ট্রো, পডকাস্ট বা মিউজিক প্লেয়ার সহ।" },
  { icon: FileText, title: "ফাইল ও সিভি", body: "PDF, ডকুমেন্ট — দর্শকরা সরাসরি ডাউনলোড করতে পারবে।" },
  { icon: MapPin, title: "লোকেশন", body: "ইন্টারঅ্যাকটিভ ম্যাপে আপনার শহর বা স্টুডিও দেখান।" },
  { icon: Palette, title: "৫টি থিম", body: "Midnight, Ember, Orchid, Forest, Paper — এক ক্লিকে বদল।" },
  { icon: Share2, title: "এক লিংকে শেয়ার", body: "প্রকাশ করলেই /p/your-name লিংক তৈরি।" },
  { icon: ShieldCheck, title: "রিড-অনলি পাবলিক", body: "দর্শকরা শুধু দেখতে পারবে, কেউ এডিট করতে পারবে না।" },
];

function Landing() {
  return (
    <main className="min-h-screen">
      <section className="grid-glow border-b">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="font-display text-lg font-bold">
            Folio<span className="text-primary">Studio</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/blog"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ব্লগ
            </Link>
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              লগইন
            </Link>
            <Link
              to="/admin"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              অ্যাডমিন প্যানেল
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-5 pt-16 pb-24 text-center sm:pt-24 sm:pb-32">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> AI-বেইজড স্ট্যাটিক পোর্টফোলিও বিল্ডার
          </span>
          <h1 className="mx-auto mt-7 max-w-3xl font-display text-4xl leading-[1.08] font-bold sm:text-6xl">
            আপনার পোর্টফোলিও বানান,
            <span className="block text-primary">এক লিংকে শেয়ার করুন</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            আলাদা অ্যাডমিন প্যানেলে ড্র্যাগ-ফ্রি সেকশন বিল্ডার। ভিডিও, অডিও, ফাইল, লোকেশন যোগ করুন —
            প্রকাশ করলেই পাবলিক লিংক, যেখানে সবাই শুধু দেখতে পারবে।
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              ফ্রি শুরু করুন
            </Link>
            <a
              href="#features"
              className="glass rounded-full px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              ফিচার দেখুন
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <h2 className="font-display text-2xl font-bold sm:text-4xl">যা যা করতে পারবেন</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          একটি অ্যাডভান্স বিল্ডার — সেকশন যোগ করুন, সাজান, লুকান, থিম বদলান, তারপর প্রকাশ করুন।
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article key={f.title} className="glass rounded-2xl p-5">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="glass grid-glow flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center">
          <Link2 className="size-6 text-primary" />
          <h2 className="max-w-lg font-display text-2xl font-bold sm:text-3xl">
            লিংক পান, শেয়ার করুন — বাকিরা শুধু দেখবে
          </h2>
          <code className="rounded-full border border-border bg-secondary px-4 py-2 text-sm text-muted-foreground">
            /p/your-name
          </code>
          <Link
            to="/auth"
            className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            অ্যাকাউন্ট তৈরি করুন
          </Link>
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Folio Studio · Cloudflare-এ ডিপ্লয়যোগ্য
      </footer>
    </main>
  );
}
