import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Ban, Copy, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createInviteCode } from "@/lib/invites.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CodeRow = {
  id: string;
  code: string;
  email: string | null;
  note: string | null;
  is_active: boolean;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/himusadmin/codes")({
  head: () => ({
    meta: [
      { title: "ইনভাইট কোড — Folio Studio অ্যাডমিন" },
      { name: "description", content: "ইউজারদের জন্য ইউনিক লগইন কোড তৈরি ও নিয়ন্ত্রণ করুন।" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "ইনভাইট কোড — Folio Studio" },
      { property: "og:description", content: "ইউনিক কোড জেনারেট করে নির্দিষ্ট ইউজারকে অ্যাক্সেস দিন।" },
    ],
  }),
  component: CodesPage,
});

function CodesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CodeRow[] | null>(null);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, code, email, note, is_active, expires_at, used_at, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("কোড লোড করা যায়নি — আপনি অ্যাডমিন কি না দেখুন।");
      setRows([]);
      return;
    }
    setRows((data ?? []) as CodeRow[]);
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function generate() {
    setBusy(true);
    try {
      await createInviteCode({
        data: { email: email.trim() || undefined, note: note.trim() || undefined },
      });
      setEmail("");
      setNote("");
      toast.success("নতুন কোড তৈরি হয়েছে।");
      await load();
    } catch {
      toast.error("কোড তৈরি করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("invite_codes").update({ is_active: false }).eq("id", id);
    if (error) toast.error("বাতিল করা যায়নি।");
    else {
      toast.success("কোড বাতিল হয়েছে।");
      await load();
    }
  }

  return (
    <main className="grid-glow min-h-screen px-5 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link to="/himusadmin" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" /> ড্যাশবোর্ড
          </Link>
          <h1 className="font-display text-lg font-semibold">ইনভাইট কোড</h1>
        </div>

        <div className="glass rounded-3xl p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            ইমেইল দিলে কোডটি শুধু সেই ইমেইলেই কাজ করবে। খালি রাখলে যে কেউ একবার ব্যবহার করতে পারবে।
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-email">ইমেইল (ঐচ্ছিক)</Label>
              <Input
                id="c-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-note">নোট (ঐচ্ছিক)</Label>
              <Input id="c-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <Button className="mt-4 w-full sm:w-auto" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            কোড জেনারেট করুন
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {rows === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">এখনো কোনো কোড নেই।</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
                <code className="font-mono text-base tracking-widest">{r.code}</code>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.used_at
                      ? "bg-muted text-muted-foreground"
                      : r.is_active
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {r.used_at ? "ব্যবহৃত" : r.is_active ? "সক্রিয়" : "বাতিল"}
                </span>
                {r.email ? <span className="text-xs text-muted-foreground">{r.email}</span> : null}
                {r.note ? <span className="text-xs text-muted-foreground">• {r.note}</span> : null}
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(r.code);
                      toast.success("কোড কপি হয়েছে।");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                  {r.is_active && !r.used_at ? (
                    <Button size="sm" variant="outline" onClick={() => revoke(r.id)}>
                      <Ban className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
