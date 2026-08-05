import { Download, FileText, Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import type { PortfolioContent, Section } from "@/lib/portfolio-types";
import { mediaUrl } from "@/lib/portfolio-types";

function embedSrc(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function mapSrc(s: Section) {
  const { lat, lng, address, place } = s.data;
  if (typeof lat === "number" && typeof lng === "number") {
    const d = 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  const q = encodeURIComponent(address || place || "");
  return q ? `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${q}` : "";
}

function SectionShell({ section, children }: { section: Section; children: React.ReactNode }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">{section.title}</h2>
      <div
        className="mt-3 h-px w-16"
        style={{ backgroundColor: "var(--pf-accent)", opacity: 0.8 }}
      />
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ backgroundColor: "var(--pf-card)", borderColor: "color-mix(in oklab, var(--pf-fg) 12%, transparent)" }}
    >
      {children}
    </div>
  );
}

function Hero({ section }: { section: Section }) {
  const { name, role, body, avatar } = section.data;
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
      {avatar ? (
        <img
          src={mediaUrl(avatar)}
          alt={name ? `${name} এর ছবি` : "প্রোফাইল ছবি"}
          loading="lazy"
          className="size-28 shrink-0 rounded-2xl object-cover sm:size-36"
          style={{ outline: "2px solid var(--pf-accent)", outlineOffset: "3px" }}
        />
      ) : null}
      <div>
        {role ? (
          <p
            className="text-xs font-medium tracking-[0.2em] uppercase"
            style={{ color: "var(--pf-accent)" }}
          >
            {role}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl leading-tight font-bold sm:text-6xl">{name}</h1>
        {body ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--pf-muted)" }}>
            {body}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function SectionBody({ section }: { section: Section }) {
  const d = section.data;

  switch (section.type) {
    case "text":
      return (
        <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed" style={{ color: "var(--pf-muted)" }}>
          {d.body}
        </p>
      );

    case "skills":
      return (
        <ul className="flex flex-wrap gap-2">
          {(d.skills ?? []).map((s) => (
            <li
              key={s}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: "color-mix(in oklab, var(--pf-accent) 45%, transparent)",
                color: "var(--pf-fg)",
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      );

    case "projects":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {(d.projects ?? []).map((p, i) => (
            <Card key={i}>
              {p.cover ? (
                <img
                  src={mediaUrl(p.cover)}
                  alt={`${p.title} প্রজেক্টের ছবি`}
                  loading="lazy"
                  className="mb-4 aspect-video w-full rounded-xl object-cover"
                />
              ) : null}
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>
                {p.description}
              </p>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "var(--pf-accent)" }}
                >
                  দেখুন <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      );

    case "gallery":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(d.media ?? []).map((m) => (
            <img
              key={m.path}
              src={mediaUrl(m)}
              alt={m.name}
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      );

    case "video":
      return (
        <div className="space-y-4">
          {d.embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                src={embedSrc(d.embedUrl)}
                title={section.title}
                allowFullScreen
                className="size-full"
              />
            </div>
          ) : null}
          {(d.media ?? []).map((m) => (
            <video key={m.path} src={mediaUrl(m)} controls className="w-full rounded-2xl" />
          ))}
        </div>
      );

    case "audio":
      return (
        <div className="space-y-3">
          {(d.media ?? []).map((m) => (
            <Card key={m.path}>
              <p className="mb-3 text-sm font-medium">{m.name}</p>
              <audio src={mediaUrl(m)} controls className="w-full" />
            </Card>
          ))}
        </div>
      );

    case "files":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(d.media ?? []).map((m) => (
            <a
              key={m.path}
              href={mediaUrl(m)}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 rounded-xl border p-4 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--pf-card)",
                borderColor: "color-mix(in oklab, var(--pf-fg) 12%, transparent)",
              }}
            >
              <FileText className="size-5 shrink-0" style={{ color: "var(--pf-accent)" }} />
              <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
              <Download className="size-4 shrink-0" style={{ color: "var(--pf-muted)" }} />
            </a>
          ))}
        </div>
      );

    case "location": {
      const src = mapSrc(section);
      return (
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm" style={{ color: "var(--pf-muted)" }}>
            <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: "var(--pf-accent)" }} />
            <span>
              {d.place ? <strong className="font-medium">{d.place}</strong> : null}
              {d.place && d.address ? " — " : ""}
              {d.address}
            </span>
          </p>
          {src ? (
            <iframe
              src={src}
              title="Map"
              loading="lazy"
              className="h-72 w-full rounded-2xl border-0"
            />
          ) : null}
        </div>
      );
    }

    case "timeline":
      return (
        <ol className="space-y-6 border-l pl-6" style={{ borderColor: "color-mix(in oklab, var(--pf-fg) 15%, transparent)" }}>
          {(d.timeline ?? []).map((t, i) => (
            <li key={i} className="relative">
              <span
                className="absolute top-1.5 -left-[1.9rem] size-2.5 rounded-full"
                style={{ backgroundColor: "var(--pf-accent)" }}
              />
              <p className="text-xs tracking-wide uppercase" style={{ color: "var(--pf-accent)" }}>
                {t.period}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">{t.title}</h3>
              {t.subtitle ? <p className="text-sm">{t.subtitle}</p> : null}
              {t.description ? (
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>
                  {t.description}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      );

    case "links":
      return (
        <div className="flex flex-wrap gap-3">
          {(d.links ?? []).map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ borderColor: "color-mix(in oklab, var(--pf-accent) 45%, transparent)" }}
            >
              {l.label} <ExternalLink className="size-3.5" />
            </a>
          ))}
        </div>
      );

    case "contact":
      return (
        <div className="flex flex-wrap gap-3">
          {d.email ? (
            <a
              href={`mailto:${d.email}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: "var(--pf-accent)", color: "var(--pf-bg)" }}
            >
              <Mail className="size-4" /> {d.email}
            </a>
          ) : null}
          {d.phone ? (
            <a
              href={`tel:${d.phone}`}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "color-mix(in oklab, var(--pf-accent) 45%, transparent)" }}
            >
              <Phone className="size-4" /> {d.phone}
            </a>
          ) : null}
        </div>
      );

    default:
      return null;
  }
}

export function PortfolioView({
  title,
  tagline,
  theme,
  content,
}: {
  title: string;
  tagline?: string | null;
  theme: string;
  content: PortfolioContent;
}) {
  const sections = (content.sections ?? []).filter((s) => s.visible !== false);
  const hero = sections.find((s) => s.type === "hero");
  const rest = sections.filter((s) => s.type !== "hero");

  return (
    <div
      data-theme={theme}
      className="min-h-screen"
      style={{ backgroundColor: "var(--pf-bg)", color: "var(--pf-fg)" }}
    >
      <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        {hero ? (
          <Hero section={hero} />
        ) : (
          <header>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
            {tagline ? (
              <p className="mt-3 text-base" style={{ color: "var(--pf-muted)" }}>
                {tagline}
              </p>
            ) : null}
          </header>
        )}

        <div className="mt-16 space-y-16">
          {rest.map((s) => (
            <SectionShell key={s.id} section={s}>
              <SectionBody section={s} />
            </SectionShell>
          ))}
        </div>
      </div>
    </div>
  );
}
