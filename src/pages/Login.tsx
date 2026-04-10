import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  // Auth guard: redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile?.role) {
      const role = profile.role;
      if (role === "admin") navigate("/admin");
      else if (role === "business") navigate("/business");
      else if (role === "freelancer") navigate("/freelancer");
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch role directly from profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profileData?.role;

    if (role === "admin") {
      navigate("/admin");
    } else if (role === "business") {
      navigate("/business");
    } else if (role === "freelancer") {
      navigate("/freelancer");
    } else {
      navigate("/");
      toast({ title: t('login.noRoleAssigned') });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setForgotSent(true);
    }
    setLoading(false);
  };

  if (forgotMode) {
    return (
      <Layout>
        <div className="container flex min-h-[70vh] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <img src={logo} alt="Namso logo" className="mx-auto mb-4 h-16 w-16 rounded-lg" />
              <h1 className="font-display text-2xl font-bold text-foreground">{t('login.resetPasswordTitle')}</h1>
              <p className="mt-1 text-muted-foreground">
                {forgotSent
                  ? t('login.resetSentText')
                  : t('login.resetPromptText')}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              {forgotSent ? (
                <div className="text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('login.resetIfAccountExists')}
                  </p>
                  <Button variant="outline" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                    {t('login.backToLogin')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t('login.emailLabel')}</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                    {loading ? t('login.sending') : t('login.sendResetLink')}
                  </Button>
                  <button type="button" className="w-full text-center text-sm text-primary hover:underline" onClick={() => setForgotMode(false)}>
                    {t('login.backToLogin')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={logo} alt="Namso logo" className="mx-auto mb-4 h-16 w-16 rounded-lg" />
            <h1 className="font-display text-2xl font-bold text-foreground">{t('login.welcomeBack')}</h1>
            <p className="mt-1 text-muted-foreground">{t('login.loginToAccount')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('login.secureAccess')}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            {pendingMessage && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">{pendingMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('login.email')}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-10" value={email} onChange={(e) => { setEmail(e.target.value); setPendingMessage(""); }} required />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('login.password')}</Label>
                  <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setForgotMode(true)}>
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                {loading ? t('login.loggingIn') : <>{t('login.logIn')} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              <Shield className="mr-1 inline h-3 w-3" />
              {t('login.forBusinesses')}
            </div>

            <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
              <p>
                {t('login.businessJoin')}{" "}
                <Link to="/signup/business" className="font-medium text-primary hover:underline">{t('login.joinAsBusiness')}</Link>
              </p>
              <p>
                {t('login.freelancerJoin')}{" "}
                <Link to="/signup/freelancer" className="font-medium text-primary hover:underline">{t('login.joinAsFreelancer')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
