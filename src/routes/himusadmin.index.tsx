import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Eye, Loader2, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify, type PortfolioRow } from "@/lib/portfolio-types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — Folio Studio" },
      {
        name: "description",
        content: "আপনার সব পোর্টফোলিও এক জায়গায় — তৈরি করুন, এডিট করুন, শেয়ার লিংক পান।",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "অ্যাডমিন ড্যাশবোর্ড — Folio Studio" },
      { property: "og:description", content: "পোর্টফোলিও তৈরি ও শেয়ার করার কন্ট্রোল প্যানেল।" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PortfolioRow[] | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("portfolios")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) toast.error("পোর্টফোলিও লোড করা যায়নি।");
        setRows((data ?? []) as unknown as PortfolioRow[]);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  async function create() {
    if (!user) return;
    setCreating(true);
    const base = slugify(user.email?.split("@")[0] ?? "portfolio") || "portfolio";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("portfolios")
      .insert({
        user_id: user.id,
        slug,
        title: "আমার পোর্টফোলিও",
        tagline: "",
        theme: "midnight",
        content: { sections: [] },
      })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error("তৈরি করা যায়নি, আবার চেষ্টা করুন।");
      return;
    }
    navigate({ to: "/admin/$id", params: { id: data.id } });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("portfolios").delete().eq("id", id);
    if (error) {
      toast.error("মুছে ফেলা যায়নি।");
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    toast.success("মুছে ফেলা হয়েছে।");
  }

  function copyLink(slug: string) {
    void navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    toast.success("শেয়ার লিংক কপি হয়েছে।");
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">অ্যাডমিন প্যানেল</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              নতুন পোর্টফোলিও
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/blog">ব্লগ ম্যানেজার</Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="size-4" /> লগআউট
            </Button>
          </div>
        </header>

        <section className="mt-8 space-y-3">
          {rows === null ? (
            <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>
          ) : rows.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                এখনো কোনো পোর্টফোলিও নেই। “নতুন পোর্টফোলিও” চেপে শুরু করুন।
              </p>
            </div>
          ) : (
            rows.map((r) => (
              <article
                key={r.id}
                className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium">{r.title}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        r.is_published
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r.is_published ? "পাবলিশড" : "ড্রাফট"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    /p/{r.slug} · <Eye className="inline size-3" /> {r.views} ভিউ
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/admin/$id" params={{ id: r.id }}>
                      <Pencil className="size-4" /> এডিট
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copyLink(r.slug)}>
                    <Copy className="size-4" /> লিংক
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/p/$slug" params={{ slug: r.slug }} target="_blank">
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="মুছুন"
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
