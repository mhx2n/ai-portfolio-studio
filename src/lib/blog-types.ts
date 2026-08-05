export type BlogPostRow = {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  tags: string[];
  body_md: string;
  is_published: boolean;
  published_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
};

export type PublicPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  tags: string[];
  body_md: string;
  published_at: string | null;
  views: number;
  updated_at: string;
};

export type PublicPostCard = Omit<PublicPost, "body_md">;

export type BlogSettings = {
  title: string;
  description: string;
  accent: string;
  font: string;
  layout: string;
};

export const BLOG_FONTS = [
  { id: "space-grotesk", label: "Space Grotesk (মডার্ন)", stack: '"Space Grotesk", ui-sans-serif, sans-serif' },
  { id: "dm-sans", label: "DM Sans (ক্লিন)", stack: '"DM Sans", ui-sans-serif, sans-serif' },
  { id: "lora", label: "Lora (সিরিফ / পড়ার জন্য)", stack: 'Lora, ui-serif, Georgia, serif' },
  { id: "jetbrains-mono", label: "JetBrains Mono (টেকনিক্যাল)", stack: '"JetBrains Mono", ui-monospace, monospace' },
] as const;

export const BLOG_LAYOUTS = [
  { id: "list", label: "লিস্ট (রেফারেন্স ব্লগের মতো)" },
  { id: "cards", label: "কার্ড গ্রিড" },
  { id: "magazine", label: "ম্যাগাজিন (বড় ফিচার্ড পোস্ট)" },
] as const;

export const BLOG_ACCENTS = ["#6ee7f9", "#fb923c", "#c084fc", "#4ade80", "#f472b6", "#facc15"] as const;

export function fontStack(id: string) {
  return BLOG_FONTS.find((f) => f.id === id)?.stack ?? BLOG_FONTS[0].stack;
}

export function readingMinutes(md: string) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(value: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value.slice(0, 10);
  }
}
