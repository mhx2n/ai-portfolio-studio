import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import type { Section, MediaItem, ProjectItem, TimelineItem, LinkItem } from "@/lib/portfolio-types";
import { SECTION_LABELS } from "@/lib/portfolio-types";
import { aiWrite } from "@/lib/portfolio.functions";
import { MediaInput } from "./MediaInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  userId: string;
  section: Section;
  onChange: (next: Section) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
};

export function SectionEditor({ userId, section, onChange, onRemove, onMove }: Props) {
  const [open, setOpen] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const runAi = useServerFn(aiWrite);

  const d = section.data;
  const setData = (patch: Partial<Section["data"]>) =>
    onChange({ ...section, data: { ...d, ...patch } });

  async function ai(kind: "hero" | "text" | "tagline" | "improve", prompt: string) {
    if (prompt.trim().length < 3) {
      toast.error("AI-কে অন্তত কয়েকটি শব্দ দিন (যেমন: আপনার পেশা)।");
      return;
    }
    setAiBusy(true);
    try {
      const { text } = await runAi({ data: { kind, prompt } });
      setData({ body: text });
      toast.success("AI লিখে দিয়েছে।");
    } catch {
      toast.error("AI এখন উত্তর দিতে পারছে না, আবার চেষ্টা করুন।");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="glass rounded-2xl">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="rounded-md bg-secondary px-2 py-1 text-[10px] tracking-wide uppercase">
            {SECTION_LABELS[section.type]}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{section.title}</span>
        </button>
        <button
          type="button"
          aria-label={section.visible ? "লুকান" : "দেখান"}
          className="rounded p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onChange({ ...section, visible: !section.visible })}
        >
          {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
        <button
          type="button"
          aria-label="উপরে"
          className="rounded p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onMove(-1)}
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="নিচে"
          className="rounded p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onMove(1)}
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label="মুছুন"
          className="rounded p-1.5 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-border p-4">
          <div className="space-y-2">
            <Label>সেকশনের শিরোনাম</Label>
            <Input value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
          </div>

          {section.type === "hero" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>নাম</Label>
                  <Input value={d.name ?? ""} onChange={(e) => setData({ name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>পেশা / রোল</Label>
                  <Input value={d.role ?? ""} onChange={(e) => setData({ role: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>প্রোফাইল ছবি</Label>
                <MediaInput
                  userId={userId}
                  accept="image/*"
                  multiple={false}
                  label="ছবি বাছুন"
                  value={d.avatar ? [d.avatar] : []}
                  onChange={(next) => setData({ avatar: next[0] ?? null })}
                />
              </div>
              <TextWithAi
                label="পরিচিতি"
                value={d.body ?? ""}
                onChange={(body) => setData({ body })}
                busy={aiBusy}
                onAi={() => ai("hero", `${d.name ?? ""} — ${d.role ?? ""}. ${d.body ?? ""}`)}
              />
            </>
          ) : null}

          {section.type === "text" ? (
            <TextWithAi
              label="লেখা"
              rows={7}
              value={d.body ?? ""}
              onChange={(body) => setData({ body })}
              busy={aiBusy}
              onAi={() => ai(d.body && d.body.length > 40 ? "improve" : "text", d.body ?? "")}
            />
          ) : null}

          {section.type === "skills" ? (
            <div className="space-y-2">
              <Label>স্কিল (কমা দিয়ে লিখুন)</Label>
              <Input
                value={(d.skills ?? []).join(", ")}
                placeholder="React, Figma, Python"
                onChange={(e) =>
                  setData({
                    skills: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          ) : null}

          {section.type === "projects" ? (
            <RepeatList<ProjectItem>
              items={d.projects ?? []}
              onChange={(projects) => setData({ projects })}
              empty={{ title: "", description: "", url: "", cover: null }}
              addLabel="প্রজেক্ট যোগ করুন"
              render={(item, update) => (
                <div className="space-y-3">
                  <Input
                    placeholder="প্রজেক্টের নাম"
                    value={item.title}
                    onChange={(e) => update({ ...item, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="সংক্ষিপ্ত বর্ণনা"
                    value={item.description}
                    onChange={(e) => update({ ...item, description: e.target.value })}
                  />
                  <Input
                    placeholder="https://link"
                    value={item.url ?? ""}
                    onChange={(e) => update({ ...item, url: e.target.value })}
                  />
                  <MediaInput
                    userId={userId}
                    accept="image/*"
                    multiple={false}
                    label="কভার ছবি"
                    value={item.cover ? [item.cover] : []}
                    onChange={(next) => update({ ...item, cover: next[0] ?? null })}
                  />
                </div>
              )}
            />
          ) : null}

          {section.type === "gallery" ? (
            <MediaInput
              userId={userId}
              accept="image/*"
              label="ছবি যোগ করুন"
              value={d.media ?? []}
              onChange={(media) => setData({ media })}
            />
          ) : null}

          {section.type === "video" ? (
            <>
              <div className="space-y-2">
                <Label>YouTube / Vimeo লিংক</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={d.embedUrl ?? ""}
                  onChange={(e) => setData({ embedUrl: e.target.value })}
                />
              </div>
              <MediaInput
                userId={userId}
                accept="video/*"
                label="ভিডিও আপলোড"
                value={d.media ?? []}
                onChange={(media) => setData({ media })}
              />
            </>
          ) : null}

          {section.type === "audio" ? (
            <MediaInput
              userId={userId}
              accept="audio/*"
              label="অডিও আপলোড"
              value={d.media ?? []}
              onChange={(media) => setData({ media })}
            />
          ) : null}

          {section.type === "files" ? (
            <MediaInput
              userId={userId}
              label="ফাইল আপলোড (PDF, DOC...)"
              value={d.media ?? []}
              onChange={(media) => setData({ media })}
            />
          ) : null}

          {section.type === "location" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>জায়গার নাম</Label>
                <Input value={d.place ?? ""} onChange={(e) => setData({ place: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ঠিকানা</Label>
                <Input value={d.address ?? ""} onChange={(e) => setData({ address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Latitude (ঐচ্ছিক)</Label>
                <Input
                  type="number"
                  step="any"
                  value={d.lat ?? ""}
                  onChange={(e) =>
                    setData({ lat: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude (ঐচ্ছিক)</Label>
                <Input
                  type="number"
                  step="any"
                  value={d.lng ?? ""}
                  onChange={(e) =>
                    setData({ lng: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                />
              </div>
            </div>
          ) : null}

          {section.type === "timeline" ? (
            <RepeatList<TimelineItem>
              items={d.timeline ?? []}
              onChange={(timeline) => setData({ timeline })}
              empty={{ period: "", title: "", subtitle: "", description: "" }}
              addLabel="ধাপ যোগ করুন"
              render={(item, update) => (
                <div className="space-y-3">
                  <Input
                    placeholder="২০২৩ — বর্তমান"
                    value={item.period}
                    onChange={(e) => update({ ...item, period: e.target.value })}
                  />
                  <Input
                    placeholder="পদবি / ডিগ্রি"
                    value={item.title}
                    onChange={(e) => update({ ...item, title: e.target.value })}
                  />
                  <Input
                    placeholder="প্রতিষ্ঠান"
                    value={item.subtitle ?? ""}
                    onChange={(e) => update({ ...item, subtitle: e.target.value })}
                  />
                  <Textarea
                    placeholder="বর্ণনা"
                    value={item.description ?? ""}
                    onChange={(e) => update({ ...item, description: e.target.value })}
                  />
                </div>
              )}
            />
          ) : null}

          {section.type === "links" ? (
            <RepeatList<LinkItem>
              items={d.links ?? []}
              onChange={(links) => setData({ links })}
              empty={{ label: "", url: "" }}
              addLabel="লিংক যোগ করুন"
              render={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="GitHub"
                    value={item.label}
                    onChange={(e) => update({ ...item, label: e.target.value })}
                  />
                  <Input
                    placeholder="https://..."
                    value={item.url}
                    onChange={(e) => update({ ...item, url: e.target.value })}
                  />
                </div>
              )}
            />
          ) : null}

          {section.type === "contact" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input value={d.email ?? ""} onChange={(e) => setData({ email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ফোন</Label>
                <Input value={d.phone ?? ""} onChange={(e) => setData({ phone: e.target.value })} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TextWithAi({
  label,
  value,
  onChange,
  onAi,
  busy,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAi: () => void;
  busy: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" size="sm" variant="ghost" onClick={onAi} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI দিয়ে লিখুন
        </Button>
      </div>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function RepeatList<T>({
  items,
  onChange,
  empty,
  render,
  addLabel,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  empty: T;
  addLabel: string;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">#{i + 1}</span>
            <button
              type="button"
              aria-label="মুছুন"
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          {render(item, (next) => onChange(items.map((x, idx) => (idx === i ? next : x))))}
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, empty])}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}
