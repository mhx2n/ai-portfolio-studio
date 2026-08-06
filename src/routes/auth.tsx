import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { signUpWithInvite } from "@/lib/invites.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগইন — Folio Studio অ্যাডমিন" },
      {
        name: "description",
        content: "Folio Studio অ্যাডমিন প্যানেলে লগইন করে আপনার শেয়ারেবল পোর্টফোলিও তৈরি করুন।",
      },
      { property: "og:title", content: "লগইন — Folio Studio" },
      { property: "og:description", content: "অ্যাডমিন প্যানেলে ঢুকে পোর্টফোলিও বানান ও প্রকাশ করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const sentConfirm = false;

  useEffect(() => {
    if (!loading && user) navigate({ to: "/himusadmin" });
  }, [user, loading, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/himusadmin" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signUpWithInvite({
        data: { email, password, fullName, code: inviteCode },
      });
      if (!result.ok) {
        toast.error(result.reason);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!");
      navigate({ to: "/himusadmin" });
    } catch {
      toast.error("সাইন আপ করা যায়নি, আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }


  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google সাইন-ইন ব্যর্থ হয়েছে।");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/himusadmin" });
  }


  return (
    <main className="grid-glow flex min-h-screen items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-lg font-bold">
          Folio<span className="text-primary">Studio</span>
        </Link>

        <div className="glass rounded-3xl p-6 sm:p-8">
          {sentConfirm ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold">ইমেইল কনফার্ম করুন</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                <strong className="text-foreground">{email}</strong> এ পাঠানো লিংকে ক্লিক করলেই
                অ্যাডমিন প্যানেলে ঢুকতে পারবেন।
              </p>
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">লগইন</TabsTrigger>
                <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={signIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">ইমেইল</Label>
                    <Input
                      id="si-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass">পাসওয়ার্ড</Label>
                    <Input
                      id="si-pass"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "লগইন করুন"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={signUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">নাম</Label>
                    <Input
                      id="su-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">ইমেইল</Label>
                    <Input
                      id="su-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">পাসওয়ার্ড</Label>
                    <Input
                      id="su-pass"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "অ্যাকাউন্ট তৈরি করুন"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!sentConfirm ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> অথবা <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
                Google দিয়ে চালিয়ে যান
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
