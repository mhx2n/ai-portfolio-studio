import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Plus, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { aiWrite } from "@/lib/portfolio.functions";
import {
  SECTION_LABELS,
  THEMES,
  emptySection,
  slugify,
  type PortfolioRow,
  type Section,
  type SectionType,
} from "@/lib/portfolio-types";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/himusadmin/$id")({
  head: () => ({
    meta: [
      { title: "পোর্টফোলিও এডিটর — Folio Studio" },
      {
        name: "description",
        content: "সেকশন সাজান, মিডিয়া আপলোড করুন, AI দিয়ে লেখা তৈরি করুন এবং শেয়ার লিংক পাবলিশ করুন।",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "পোর্টফোলিও এডিটর — Folio Studio" },
      { property: "og:description", content: "অ্যাডভান্স কাস্টমাইজেবল পোর্টফোলিও এডিটর।" },
    ],
  }),
  component: PortfolioEditor,
});

function PortfolioEditor() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const runAi = useServerFn(aiWrite);

  const [row, setRow] = useState<PortfolioRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [taglineBusy, setTaglineBusy] = useState(false);
  const [addType, setAddType] = useState<SectionType>("hero");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("portfolios")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) {
          toast.error("পোর্টফোলিও পাওয়া যায়নি।");
          navigate({ to: "/himusadmin" });
          return;
        }
        setRow(data as unknown as PortfolioRow);
      });
    return () => {
      alive = false;
    };
  }, [id, user, navigate]);

  const sections = useMemo(() => row?.content?.sections ?? [], [row]);

  function patch(next: Partial<PortfolioRow>) {
    setRow((prev) => (prev ? { ...prev, ...next } : prev));
  }

  function setSections(next: Section[]) {
    setRow((prev) => (prev ? { ...prev, content: { ...prev.content, sections: next } } : prev));
  }

  async function save(overrides?: Partial<PortfolioRow>) {
    if (!row) return;
    const merged = { ...row, ...overrides };
    const slug = slugify(merged.slug);
    if (slug.length < 3) {
      toast.error("লিংকের নাম অন্তত ৩ অক্ষরের হতে হবে (ইংরেজি অক্ষর/সংখ্যা)।");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("portfolios")
      .update({
        title: merged.title,
        tagline: merged.tagline,
        theme: merged.theme,
        slug,
        is_published: merged.is_published,
        content: merged.content as never,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505" ? "এই লিংকের নাম আগেই নেওয়া হয়েছে।" : "সেভ করা যায়নি।",
      );
      return;
    }
    setRow({ ...merged, slug });
    toast.success("সেভ হয়েছে।");
  }

  async function makeTagline() {
    if (!row) return;
    setTaglineBusy(true);
    try {
      const { text } = await runAi({
        data: { kind: "tagline", prompt: `${row.title}. ${row.tagline ?? ""}` },
      });
      patch({ tagline: text.slice(0, 140) });
    } catch {
      toast.error("AI এখন উত্তর দিতে পারছে না।");
    } finally {
      setTaglineBusy(false);
    }
  }

  if (!row) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/p/${row.slug}`;

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/himusadmin">
              <ArrowLeft className="size-4" /> ড্যাশবোর্ড
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/p/$slug" params={{ slug: row.slug }} target="_blank">
                <ExternalLink className="size-4" /> প্রিভিউ
              </Link>
            </Button>
            <Button size="sm" onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              সেভ
            </Button>
          </div>
        </header>

        <section className="glass space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold tracking-wide uppercase">সেটিংস</h2>
          <div className="space-y-2">
            <Label>শিরোনাম</Label>
            <Input value={row.title} onChange={(e) => patch({ title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>ট্যাগলাইন</Label>
              <Button size="sm" variant="ghost" onClick={makeTagline} disabled={taglineBusy}>
                {taglineBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                AI ট্যাগলাইন
              </Button>
            </div>
            <Input
              value={row.tagline ?? ""}
              onChange={(e) => patch({ tagline: e.target.value })}
              placeholder="এক লাইনে নিজের পরিচয়"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>পাবলিক লিংক (/p/…)</Label>
              <Input
                value={row.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                placeholder="my-name"
              />
            </div>
            <div className="space-y-2">
              <Label>থিম</Label>
              <Select value={row.theme} onValueChange={(theme) => patch({ theme })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
            <div>
              <p className="text-sm font-medium">পাবলিশ করুন</p>
              <p className="text-xs text-muted-foreground">
                পাবলিশ করলেই যে কেউ লিংক দিয়ে শুধু দেখতে পারবে।
              </p>
            </div>
            <Switch
              checked={row.is_published}
              onCheckedChange={(is_published) => {
                patch({ is_published });
                void save({ is_published });
              }}
            />
          </div>

          {row.is_published ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
              <Check className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-xs">{shareUrl}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(shareUrl);
                  toast.success("লিংক কপি হয়েছে।");
                }}
              >
                <Copy className="size-4" /> কপি
              </Button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">সেকশন</h2>
            <div className="flex items-center gap-2">
              <Select value={addType} onValueChange={(v) => setAddType(v as SectionType)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {SECTION_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setSections([...sections, emptySection(addType)])}>
                <Plus className="size-4" /> যোগ করুন
              </Button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              সেকশন যোগ করে পোর্টফোলিও সাজানো শুরু করুন — Hero, ভিডিও, অডিও, ফাইল, লোকেশন সবই আছে।
            </div>
          ) : (
            sections.map((s, i) => (
              <SectionEditor
                key={s.id}
                userId={user?.id ?? ""}
                section={s}
                onChange={(next) => setSections(sections.map((x, idx) => (idx === i ? next : x)))}
                onRemove={() => setSections(sections.filter((_, idx) => idx !== i))}
                onMove={(dir) => {
                  const target = i + dir;
                  if (target < 0 || target >= sections.length) return;
                  const next = [...sections];
                  const [moved] = next.splice(i, 1);
                  if (moved) next.splice(target, 0, moved);
                  setSections(next);
                }}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}
