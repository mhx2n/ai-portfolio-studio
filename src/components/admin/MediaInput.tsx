import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import type { MediaItem } from "@/lib/portfolio-types";
import { mediaUrl } from "@/lib/portfolio-types";
import { uploadMedia } from "@/lib/media";
import { Button } from "@/components/ui/button";

export function MediaInput({
  userId,
  value,
  onChange,
  accept,
  multiple = true,
  label = "ফাইল আপলোড",
}: {
  userId: string;
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded: MediaItem[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} — ৫০ MB এর বেশি ফাইল দেওয়া যাবে না।`);
          continue;
        }
        uploaded.push(await uploadMedia(userId, file));
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(-1));
      if (uploaded.length) toast.success("আপলোড হয়েছে।");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {label}
      </Button>

      {value.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((m) => (
            <li
              key={m.path}
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2"
            >
              {m.mime.startsWith("image/") ? (
                <img
                  src={mediaUrl(m)}
                  alt={m.name}
                  className="size-10 shrink-0 rounded object-cover"
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-xs">{m.name}</span>
              <button
                type="button"
                aria-label="সরান"
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(value.filter((x) => x.path !== m.path))}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
