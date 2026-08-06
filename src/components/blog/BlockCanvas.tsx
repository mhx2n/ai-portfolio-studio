import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  GripVertical,
  Heart,
  Info,
  Lightbulb,
  Link as LinkIcon,
  MapPin,
  Maximize2,
  Move,
  Pencil,
  Play,
  Rocket,
  Sparkle,
  Star,
  Trash2,
  AlertTriangle,
  Ban,
  X,
} from "lucide-react";
import { Markdown } from "./Markdown";
import {
  blockLabel,
  blockToMarkdown,
  canAlign,
  canCaption,
  canIcon,
  canResize,
  parseBlocks,
  readAlign,
  readCaption,
  readCaptionPos,
  readCaptionSize,

  readIcon,
  readWidth,
  serializeBlocks,
  writeAlign,
  writeCaption,
  writeCaptionPos,
  writeIcon,
  writeWidth,
  readFloat,
  writeFloat,
  readNudgeX,
  writeNudgeX,
  readNudgeY,
  writeNudgeY,
  readRotate,
  writeRotate,
  type BlockFloat,
  type BlockAlign,
  type BlockIcon,
  type CanvasBlock,
} from "@/lib/blog-blocks";

const ALIGNS: { id: BlockAlign; label: string; Icon: typeof AlignLeft }[] = [
  { id: "left", label: "বাঁয়ে", Icon: AlignLeft },
  { id: "center", label: "মাঝে", Icon: AlignCenter },
  { id: "right", label: "ডানে", Icon: AlignRight },
];

const ICONS: { id: BlockIcon; Icon: typeof Info }[] = [
  { id: "none", Icon: Ban },
  { id: "info", Icon: Info },
  { id: "tip", Icon: Lightbulb },
  { id: "success", Icon: CheckCircle2 },
  { id: "warn", Icon: AlertTriangle },
  { id: "star", Icon: Star },
  { id: "heart", Icon: Heart },
  { id: "flame", Icon: Flame },
  { id: "rocket", Icon: Rocket },
  { id: "bell", Icon: Bell },
  { id: "pin", Icon: MapPin },
  { id: "link", Icon: LinkIcon },
  { id: "download", Icon: Download },
  { id: "play", Icon: Play },
  { id: "sparkle", Icon: Sparkle },
];

/** Live-preview canvas: every block renders exactly as readers will see it. */
export function BlockCanvas({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [blocks, setBlocks] = useState<CanvasBlock[]>(() => parseBlocks(value));
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [live, setLive] = useState<string | null>(null);
  const lastRef = useRef(value);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  /** Free drag: moves a block by pointer, writing x% / y px meta. */
  function startMove(e: React.PointerEvent, block: CanvasBlock) {
    if (!block.lang) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = readNudgeX(block.source);
    const baseY = readNudgeY(block.source);
    const colWidth = wrapRef.current?.getBoundingClientRect().width || 320;
    let source = block.source;
    setLive(block.uid);
    const onMove = (ev: PointerEvent) => {
      const dxPct = baseX + ((ev.clientX - startX) / colWidth) * 100;
      const dyPx = baseY + (ev.clientY - startY);
      source = writeNudgeY(writeNudgeX(block.source, dxPct), dyPx);
      setBlocks((prev) => prev.map((b) => (b.uid === block.uid ? { ...b, source } : b)));
    };
    const end = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      setLive(null);
      update(block.uid, source);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  /** Corner handle: resizes width by pointer. */
  function startResize(e: React.PointerEvent, block: CanvasBlock) {
    if (!block.lang) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const base = readWidth(block.source);
    const colWidth = wrapRef.current?.getBoundingClientRect().width || 320;
    let source = block.source;
    setLive(block.uid);
    const onMove = (ev: PointerEvent) => {
      const next = base + ((ev.clientX - startX) / colWidth) * 100;
      source = writeWidth(block.source, next);
      setBlocks((prev) => prev.map((b) => (b.uid === block.uid ? { ...b, source } : b)));
    };
    const end = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      setLive(null);
      update(block.uid, source);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  useEffect(() => {
    if (value === lastRef.current) return;
    lastRef.current = value;
    setBlocks(parseBlocks(value));
  }, [value]);

  function commit(next: CanvasBlock[]) {
    setBlocks(next);
    const md = serializeBlocks(next);
    lastRef.current = md;
    onChange(md);
  }

  function move(uid: string, delta: number) {
    const index = blocks.findIndex((b) => b.uid === uid);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    if (item) next.splice(target, 0, item);
    commit(next);
  }

  function reorder(fromUid: string, toUid: string) {
    if (fromUid === toUid) return;
    const from = blocks.findIndex((b) => b.uid === fromUid);
    const to = blocks.findIndex((b) => b.uid === toUid);
    if (from < 0 || to < 0) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    commit(next);
  }

  function update(uid: string, source: string) {
    commit(blocks.map((b) => (b.uid === uid ? { ...b, source } : b)));
  }

  function remove(uid: string) {
    commit(blocks.filter((b) => b.uid !== uid));
    if (selected === uid) setSelected(null);
    if (editing === uid) setEditing(null);
  }

  function duplicate(uid: string) {
    const index = blocks.findIndex((b) => b.uid === uid);
    const item = blocks[index];
    if (!item) return;
    const next = [...blocks];
    next.splice(index + 1, 0, { ...item, uid: `${item.uid}-copy-${Date.now()}` });
    commit(next);
  }

  if (!blocks.length) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        এখনো কোনো সেকশন নেই — নিচের “সেকশন যোগ করুন” থেকে শুরু করুন।
      </div>
    );
  }

  return (
    <div className="space-y-1" ref={wrapRef}>
      {blocks.map((block, index) => {
        const isSelected = selected === block.uid;
        const isEditing = editing === block.uid;
        const width = readWidth(block.source);
        const align = readAlign(block.source);
        const icon = readIcon(block.source);
        const caption = readCaption(block.source);
        const captionPos = readCaptionPos(block.source);
        const side = readFloat(block.source);
        const nudgeX = readNudgeX(block.source);
        const nudgeY = readNudgeY(block.source);
        const rotate = readRotate(block.source);
        return (
          <div
            key={block.uid}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging) reorder(dragging, block.uid);
              setDragging(null);
            }}
            onClick={() => setSelected(block.uid)}
            className={`group relative rounded-2xl border-2 p-2 transition-[border-color,box-shadow] duration-200 will-change-transform ${
              isSelected
                ? "border-primary/70 shadow-lg"
                : "border-transparent hover:border-primary/25"
            } ${dragging === block.uid ? "opacity-50" : ""} ${
              live === block.uid ? "z-20 border-primary shadow-2xl" : ""
            }`}
          >
            {/* Hover/selected chrome sits over the live preview. */}
            <div
              className={`absolute -top-2.5 left-2 z-10 flex items-center gap-1 transition-opacity ${
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <span
                draggable
                onDragStart={() => setDragging(block.uid)}
                onDragEnd={() => setDragging(null)}
                onPointerDown={(e) => {
                  if (e.pointerType !== "mouse") startMove(e, block);
                }}
                title="ধরে টেনে যেখানে ইচ্ছা বসান (ক্রম বদলাতে মাউসে ড্র্যাগ)"
                className="flex touch-none cursor-grab items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium shadow-sm active:cursor-grabbing"
              >
                <GripVertical className="size-3" />
                {index + 1}. {blockLabel(block)}
              </span>
              {block.lang ? (
                <span
                  onPointerDown={(e) => startMove(e, block)}
                  title="মুক্তভাবে সরান"
                  className="grid size-6 touch-none cursor-move place-items-center rounded-full border bg-background text-muted-foreground shadow-sm"
                >
                  <Move className="size-3.5" />
                </span>
              ) : null}
            </div>

            <div
              className={`absolute -top-2.5 right-2 z-10 flex items-center gap-1 transition-opacity ${
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <IconBtn label="উপরে" onClick={() => move(block.uid, -1)}>
                <ArrowUp className="size-3.5" />
              </IconBtn>
              <IconBtn label="নিচে" onClick={() => move(block.uid, 1)}>
                <ArrowDown className="size-3.5" />
              </IconBtn>
              <IconBtn label="সোর্স এডিট" onClick={() => setEditing(isEditing ? null : block.uid)}>
                {isEditing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
              </IconBtn>
              <IconBtn label="কপি" onClick={() => duplicate(block.uid)}>
                <Copy className="size-3.5" />
              </IconBtn>
              <IconBtn label="মুছুন" onClick={() => remove(block.uid)} danger>
                <Trash2 className="size-3.5" />
              </IconBtn>
            </div>

            {/* Real preview — exactly what readers see. */}
            <div className="rounded-xl px-1">
              <Markdown>{blockToMarkdown(block)}</Markdown>
            </div>

            {block.lang && canResize(block.lang) ? (
              <span
                onPointerDown={(e) => startResize(e, block)}
                title="কোণা টেনে সাইজ বদলান"
                className={`absolute -bottom-2 -right-2 z-10 grid size-7 touch-none cursor-nwse-resize place-items-center rounded-full border-2 border-primary/60 bg-background text-primary shadow-md transition-opacity ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <Maximize2 className="size-3.5" />
              </span>
            ) : null}

            {live === block.uid ? (
              <span className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground tabular-nums">
                {width}% · {nudgeX}% · {nudgeY}px
              </span>
            ) : null}


            {isSelected ? (
              <div
                className="mt-2 space-y-2 rounded-xl border bg-muted/30 p-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                {canResize(block.lang) ? (
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-16 shrink-0">সাইজ</span>
                    <input
                      type="range"
                      min={30}
                      max={100}
                      step={5}
                      value={width}
                      onChange={(e) =>
                        update(block.uid, writeWidth(block.source, Number(e.target.value)))
                      }
                      className="h-1.5 min-w-0 flex-1 accent-primary"
                    />
                    <span className="w-10 shrink-0 text-right tabular-nums">{width}%</span>
                  </label>
                ) : null}

                {block.lang ? (
                  <>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-16 shrink-0">বসানো</span>
                      {(
                        [
                          { id: "none", label: "সম্পূর্ণ সারি" },
                          { id: "left", label: "বাঁয়ে ভাসবে" },
                          { id: "right", label: "ডানে ভাসবে" },
                        ] as { id: BlockFloat; label: string }[]
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          title={f.label}
                          onClick={() => update(block.uid, writeFloat(block.source, f.id))}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${
                            side === f.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <Slider
                      label="ডানে/বাঁয়ে"
                      min={-40}
                      max={40}
                      step={1}
                      value={nudgeX}
                      suffix="%"
                      onChange={(v) => update(block.uid, writeNudgeX(block.source, v))}
                    />
                    <Slider
                      label="উপরে/নিচে"
                      min={-120}
                      max={120}
                      step={4}
                      value={nudgeY}
                      suffix="px"
                      onChange={(v) => update(block.uid, writeNudgeY(block.source, v))}
                    />
                    <Slider
                      label="কাত"
                      min={-12}
                      max={12}
                      step={1}
                      value={rotate}
                      suffix="°"
                      onChange={(v) => update(block.uid, writeRotate(block.source, v))}
                    />
                  </>
                ) : null}

                {canAlign(block.lang) ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="w-16 shrink-0">অ্যালাইন</span>
                    {ALIGNS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        aria-label={a.label}
                        title={a.label}
                        onClick={() => update(block.uid, writeAlign(block.source, a.id))}
                        className={`grid size-7 place-items-center rounded-lg transition-colors ${
                          align === a.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:text-foreground"
                        }`}
                      >
                        <a.Icon className="size-3.5" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {canCaption(block.lang) ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
                        ক্যাপশন
                      </span>
                      <input
                        value={caption}
                        placeholder="ক্যাপশন লিখুন"
                        onChange={(e) =>
                          update(block.uid, writeCaption(block.source, e.target.value))
                        }
                        className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
                        অবস্থান
                      </span>
                      {(["top", "bottom"] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => update(block.uid, writeCaptionPos(block.source, pos))}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${
                            captionPos === pos
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {pos === "top" ? "উপরে" : "নিচে"}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
                        লেখার সাইজ
                      </span>
                      {(["sm", "md", "lg", "xl"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(block.uid, writeCaptionSize(block.source, s))}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase transition-colors ${
                            captionSize === s
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="pl-[4.5rem] text-[10px] text-muted-foreground">
                      মার্কডাউন কাজ করবে: **বোল্ড**, *ইটালিক*, {"{{red|লেখা}}"}, ==হাইলাইট==
                    </p>
                  </div>
                ) : null}

                {canIcon(block.lang) ? (
                  <div className="flex items-start gap-2">
                    <span className="mt-1 w-16 shrink-0 text-[11px] text-muted-foreground">
                      আইকন
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ICONS.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          aria-label={it.id}
                          title={it.id}
                          onClick={() => update(block.uid, writeIcon(block.source, it.id))}
                          className={`grid size-7 place-items-center rounded-lg transition-colors ${
                            icon === it.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <it.Icon className="size-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isEditing ? (
              <textarea
                value={block.source}
                onChange={(e) => update(block.uid, e.target.value)}
                spellCheck={false}
                rows={Math.min(16, Math.max(4, block.source.split("\n").length + 1))}
                className="mt-2 w-full resize-y rounded-xl border bg-muted/40 p-3 font-mono text-[12.5px] leading-relaxed"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  suffix,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 min-w-0 flex-1 accent-primary"
      />
      <span className="w-10 shrink-0 text-right tabular-nums">
        {value}
        {suffix}
      </span>
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`grid size-7 place-items-center rounded-lg border bg-background shadow-sm transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
