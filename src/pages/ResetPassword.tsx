import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type PageState = "loading" | "form" | "expired" | "success" | "resend_form" | "resend_success";

export default function ResetPassword() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorDetail, setErrorDetail] = useState("");
  const resolved = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for explicit auth errors in URL
    const hash = window.location.hash;
    const search = window.location.search;
    
    const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
    const searchParams = search ? new URLSearchParams(search) : null;

    // Check for error in URL
    const urlError = hashParams?.get("error_description") || searchParams?.get("error_description");
    if (hashParams?.get("error") || searchParams?.get("error")) {
      setErrorDetail(urlError || "This password reset link is invalid or has expired.");
      setPageState("expired");
      return;
    }

    // Detect if we have tokens/code in URL
    const hasCode = !!searchParams?.get("code");
    const hasAccessToken = !!hashParams?.get("access_token");
    const hasType = !!hashParams?.get("type");
    const hasTokens = hasCode || hasAccessToken || hasType;

    const resolve = (state: PageState, error?: string) => {
      if (resolved.current) return;
      resolved.current = true;
      if (error) setErrorDetail(error);
      setPageState(state);
    };

    // If we have a PKCE code, try to exchange it manually
    if (hasCode) {
      const code = searchParams!.get("code")!;
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error("[ResetPassword] Code exchange failed:", error.message);
          // Don't immediately fail — the auto-exchange might have worked
          // Fall through to polling
        } else if (data.session) {
          resolve("form");
          return;
        }
      });
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved.current) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        resolve("form");
      }
    });

    // Poll for session — handles cases where auth events fire before listener is set up
    const pollSession = async () => {
      // If no tokens in URL, just check for existing session once
      if (!hasTokens) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          resolve("form");
        } else {
          resolve("expired", "No reset link detected. Please use the link from your email.");
        }
        return;
      }

      // Poll for up to 15 seconds (30 attempts × 500ms)
      for (let i = 0; i < 30; i++) {
        if (resolved.current) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          resolve("form");
          return;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      
      if (!resolved.current) {
        resolve("expired", "This password reset link has expired or was opened in a different browser. Please request a new one.");
      }
    };

    pollSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorDetail("Your session has expired. Please request a new reset link.");
      setPageState("expired");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (error.message.toLowerCase().includes("session") || error.message.toLowerCase().includes("token")) {
        setErrorDetail("Your reset link has expired. Please request a new one.");
        setPageState("expired");
      } else {
        toast({ title: "Unable to update password. Please try again.", variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setPageState("success");
    setLoading(false);
  };

  const handleResendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }
    if (resendCooldown > 0) return;

    setResendLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      if (error.message.includes("rate") || error.status === 429) {
        toast({ title: "Please wait a moment before requesting another email.", variant: "destructive" });
      } else {
        toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
      }
    } else {
      setPageState("resend_success");
      setResendCooldown(60);
    }
    setResendLoading(false);
  };

  if (pageState === "loading") {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your reset link…</p>
        </div>
      </Layout>
    );
  }

  if (pageState === "expired") {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Link Expired</h1>
            <p className="mb-6 text-muted-foreground">{errorDetail || "This password reset link has expired or is no longer valid."}</p>
            <div className="space-y-3">
              <Button onClick={() => setPageState("resend_form")} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                <Mail className="mr-2 h-4 w-4" /> Request a New Reset Link
              </Button>
              <Button onClick={() => navigate("/login")} variant="outline" className="w-full" size="lg">Back to Login</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (pageState === "resend_form") {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <img src={logo} alt="Namso logo" className="mx-auto mb-4 h-16 w-16 rounded-lg" />
              <h1 className="font-display text-2xl font-bold text-foreground">Request New Reset Link</h1>
              <p className="mt-1 text-muted-foreground">Enter your email to receive a new password reset link.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              <form onSubmit={handleResendReset} className="space-y-4">
                <div>
                  <Label htmlFor="resend-email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="resend-email" type="email" placeholder="you@example.com" className="pl-10" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" disabled={resendLoading || resendCooldown > 0} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                  {resendLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Send Reset Link"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Button onClick={() => navigate("/login")} variant="link" className="text-muted-foreground">Back to Login</Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (pageState === "resend_success") {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Reset Link Sent!</h1>
            <p className="mb-4 text-muted-foreground">If an account exists with that email, you'll receive a password reset link shortly.</p>
            <p className="mb-6 text-sm text-muted-foreground">Check your inbox and spam folder. <strong>Open the link in the same browser</strong> you used to request the reset.</p>
            <Button onClick={() => navigate("/login")} variant="outline">Back to Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (pageState === "success") {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Password Updated</h1>
            <p className="mb-4 text-muted-foreground">Your password has been updated successfully. Please log in with your new password.</p>
            <Button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground hover:bg-primary/85">Go to Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // PASSWORD FORM
  return (
    <Layout>
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={logo} alt="Namso logo" className="mx-auto mb-4 h-16 w-16 rounded-lg" />
            <h1 className="font-display text-2xl font-bold text-foreground">Reset Your Password</h1>
            <p className="mt-1 text-muted-foreground">Choose a new password for your account.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="At least 8 characters" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>
              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm" type="password" placeholder="Confirm password" className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</> : <>Update Password <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate("/login")} variant="link" className="text-muted-foreground">Back to Login</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
