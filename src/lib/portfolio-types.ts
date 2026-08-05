export type MediaItem = {
  path: string;
  name: string;
  mime: string;
  size?: number;
};

export type SectionType =
  | "hero"
  | "text"
  | "skills"
  | "projects"
  | "gallery"
  | "video"
  | "audio"
  | "files"
  | "location"
  | "timeline"
  | "links"
  | "contact";

export type ProjectItem = {
  title: string;
  description: string;
  url?: string;
  cover?: MediaItem | null;
};

export type TimelineItem = {
  period: string;
  title: string;
  subtitle?: string;
  description?: string;
};

export type LinkItem = { label: string; url: string };

export type Section = {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  /** free-form payload, shape depends on `type` */
  data: {
    name?: string;
    role?: string;
    body?: string;
    avatar?: MediaItem | null;
    skills?: string[];
    projects?: ProjectItem[];
    media?: MediaItem[];
    embedUrl?: string;
    links?: LinkItem[];
    timeline?: TimelineItem[];
    email?: string;
    phone?: string;
    place?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
};

export type PortfolioContent = {
  sections: Section[];
  accent?: string;
};

export type PortfolioRow = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  theme: string;
  is_published: boolean;
  views: number;
  content: PortfolioContent;
  created_at: string;
  updated_at: string;
};

export const THEMES = [
  { id: "midnight", label: "Midnight", accent: "#6ee7f9" },
  { id: "ember", label: "Ember", accent: "#fb923c" },
  { id: "orchid", label: "Orchid", accent: "#c084fc" },
  { id: "forest", label: "Forest", accent: "#4ade80" },
  { id: "paper", label: "Paper", accent: "#0f172a" },
] as const;

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero / পরিচয়",
  text: "লেখা (About)",
  skills: "স্কিল",
  projects: "প্রজেক্ট",
  gallery: "ইমেজ গ্যালারি",
  video: "ভিডিও",
  audio: "অডিও",
  files: "ফাইল / ডকুমেন্ট",
  location: "লোকেশন",
  timeline: "টাইমলাইন",
  links: "লিংক",
  contact: "কন্টাক্ট",
};

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptySection(type: SectionType): Section {
  const base = { id: makeId(), type, visible: true };
  switch (type) {
    case "hero":
      return { ...base, title: "Hero", data: { name: "", role: "", body: "", avatar: null } };
    case "text":
      return { ...base, title: "About", data: { body: "" } };
    case "skills":
      return { ...base, title: "Skills", data: { skills: [] } };
    case "projects":
      return { ...base, title: "Projects", data: { projects: [] } };
    case "gallery":
      return { ...base, title: "Gallery", data: { media: [] } };
    case "video":
      return { ...base, title: "Video", data: { media: [], embedUrl: "" } };
    case "audio":
      return { ...base, title: "Audio", data: { media: [] } };
    case "files":
      return { ...base, title: "Files", data: { media: [] } };
    case "location":
      return { ...base, title: "Location", data: { place: "", address: "" } };
    case "timeline":
      return { ...base, title: "Timeline", data: { timeline: [] } };
    case "links":
      return { ...base, title: "Links", data: { links: [] } };
    case "contact":
      return { ...base, title: "Contact", data: { email: "", phone: "" } };
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

export function mediaUrl(item: MediaItem | null | undefined) {
  if (!item) return "";
  return `/api/public/media/${item.path.split("/").map(encodeURIComponent).join("/")}`;
}
