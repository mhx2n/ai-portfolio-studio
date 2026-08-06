import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Maximize2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Markdown } from "./Markdown";
import {
  blockLabel,
  blockSummary,
  blockToMarkdown,
  canAlign,
  canResize,
  parseBlocks,
  readAlign,
  readSize,
  serializeBlocks,
  writeAlign,
  writeSize,
  type BlockAlign,
  type BlockSize,
  type CanvasBlock,
} from "@/lib/blog-blocks";

const SIZES: { id: BlockSize; label: string }[] = [
  { id: "sm", label: "ছোট" },
  { id: "md", label: "মাঝারি" },
  { id: "full", label: "পূর্ণ" },
];

const ALIGNS: { id: BlockAlign; label: string; Icon: typeof AlignLeft }[] = [
  { id: "left", label: "বাঁয়ে", Icon: AlignLeft },
  { id: "center", label: "মাঝে", Icon: AlignCenter },
  { id: "right", label: "ডানে", Icon: AlignRight },
];

/** Visual, reorderable canvas over the post markdown. */
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
  const lastRef = useRef(value);

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
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        const isSelected = selected === block.uid;
        const isEditing = editing === block.uid;
        const size = readSize(block.source);
        const align = readAlign(block.source);
        return (
          <div
            key={block.uid}
            draggable
            onDragStart={() => setDragging(block.uid)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging) reorder(dragging, block.uid);
              setDragging(null);
            }}
            onClick={() => setSelected(block.uid)}
            className={`group rounded-2xl border bg-background p-3 transition-[box-shadow,transform,border-color] duration-200 will-change-transform ${
              isSelected ? "border-primary/60 shadow-lg" : "hover:border-primary/30"
            } ${dragging === block.uid ? "scale-[0.99] opacity-60" : ""}`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
                  {index + 1}. {blockLabel(block)}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {blockSummary(block)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconBtn label="উপরে" onClick={() => move(block.uid, -1)}>
                  <ArrowUp className="size-3.5" />
                </IconBtn>
                <IconBtn label="নিচে" onClick={() => move(block.uid, 1)}>
                  <ArrowDown className="size-3.5" />
                </IconBtn>
                <IconBtn label="এডিট" onClick={() => setEditing(isEditing ? null : block.uid)}>
                  {isEditing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
                </IconBtn>
                <IconBtn label="কপি" onClick={() => duplicate(block.uid)}>
                  <Copy className="size-3.5" />
                </IconBtn>
                <IconBtn label="মুছুন" onClick={() => remove(block.uid)} danger>
                  <Trash2 className="size-3.5" />
                </IconBtn>
              </div>
            </div>

            {canResize(block.lang) ? (
              <div className="mt-2 flex items-center gap-1.5">
                <Maximize2 className="size-3 text-muted-foreground" />
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update(block.uid, writeSize(block.source, s.id))}
                    className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                      size === s.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}

            {canAlign(block.lang) ? (
              <div className="mt-2 flex items-center gap-1.5">
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
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <a.Icon className="size-3.5" />
                  </button>
                ))}
              </div>
            ) : null}

            {isEditing ? (
              <textarea
                value={block.source}
                onChange={(e) => update(block.uid, e.target.value)}
                spellCheck={false}
                rows={Math.min(16, Math.max(4, block.source.split("\n").length + 1))}
                className="mt-2.5 w-full resize-y rounded-xl border bg-muted/40 p-3 font-mono text-[12.5px] leading-relaxed"
              />
            ) : (
              <div className="mt-2.5 overflow-hidden rounded-xl border bg-card px-3 py-1.5">
                <Markdown>{blockToMarkdown(block)}</Markdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
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
      className={`grid size-7 place-items-center rounded-lg border transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
