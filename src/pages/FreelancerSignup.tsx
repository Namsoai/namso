import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Briefcase, Brain, Globe, Zap, Euro, Users, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Layout from "@/components/Layout";
import Captcha from "@/components/Captcha";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "react-i18next";

// Very basic disposable email check
const DISPOSABLE_DOMAINS = ["tempmail.com", "guerrillamail.com", "yopmail.com", "mailinator.com", "10minutemail.com"];

const formSchema = z.object({
  firstName: z.string().min(2, "First name is strictly required."),
  lastName: z.string().min(2, "Last name is strictly required."),
  email: z.string().email("Please enter a valid email address.")
    .refine((val) => {
      const domain = val.split('@')[1];
      return domain && !DISPOSABLE_DOMAINS.includes(domain.toLowerCase());
    }, "Please use a proper work or personal email, not a disposable one."),
  phone: z.string().min(8, "A valid mobile phone number is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
  university: z.string().min(2, "Organization or university is required."),
  major: z.string().min(2, "Area of expertise is required."),
  tools: z.string().min(2, "Please list at least one tool."),
  bio: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function FreelancerSignup() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>("US");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const perks = [
    { icon: Zap, text: t('signup.freelancer.perks.monetize') },
    { icon: Briefcase, text: t('signup.freelancer.perks.portfolio') },
    { icon: Globe, text: t('signup.freelancer.perks.remote') },
    { icon: Brain, text: t('signup.freelancer.perks.sharp') },
    { icon: Euro, text: t('signup.freelancer.perks.rates') },
    { icon: Users, text: t('signup.freelancer.perks.network') },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      university: "",
      major: "",
      tools: "",
      bio: "",
    },
    mode: "onChange",
  });

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

  // Track funnel: user landed on the freelancer application page
  useEffect(() => {
    trackEvent("freelancer_application_started");
  }, []);

  const onSubmit = async (data: FormValues) => {
    if (!captchaToken) {
      toast({ title: t('signup.common.errors.captcha'), variant: "destructive" });
      return;
    }

    setLoading(true);

    const normalizedEmail = data.email.trim().toLowerCase();
    const { data: authData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: data.password,
      options: {
        data: {
          user_type: "freelancer",
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          university: data.university,
          major: data.major,
          tools: data.tools,
          bio: data.bio,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: data.password,
        });
        
        if (signInError) {
          toast({ title: t('signup.common.errors.accountExists'), description: t('signup.common.errors.incorrectPass'), variant: "destructive" });
          setLoading(false);
          return;
        }
        
        navigate("/freelancer");
        return;
      }
      
      toast({ title: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }



    // Insert Application securely from the frontend
    await supabase.from("freelancer_applications").insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: normalizedEmail,
      university: data.university,
      major: data.major,
      tools: data.tools,
      bio: data.bio
    });

    setLoading(false);
    trackEvent("freelancer_application_submitted", { major: data.major });
    navigate(`/freelancer`);
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              {t('signup.freelancer.heroTitle')}
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">
              {t('signup.freelancer.heroDesc')}
            </p>
            <p className="mb-8 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {t('signup.freelancer.idealFor')}
            </p>
            <div className="space-y-3.5">
              {perks.map((perk) => (
                <div key={perk.text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <perk.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{perk.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">{t('signup.freelancer.applyToJoin')}</h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('signup.freelancer.joinInstantly')}</p>


            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('signup.freelancer.form.firstName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('signup.freelancer.form.lastName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.freelancer.form.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.freelancer.form.phone')}</FormLabel>
                      <FormControl>
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background md:text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden items-center group">
                          <PhoneInput
                            international
                            country={selectedCountry}
                            onCountryChange={(c) => c && setSelectedCountry(c)}
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full bg-transparent border-none focus:outline-none"
                            onKeyDown={(e) => {
                              const input = e.currentTarget as HTMLInputElement;
                              const value = input.value;
                              if ((e.key === 'Backspace' || e.key === 'Delete')) {
                                const dialCodeLength = value.indexOf(' ') + 1 || 3;
                                if (input.selectionStart !== null && input.selectionStart <= dialCodeLength && input.selectionEnd === input.selectionStart) {
                                  e.preventDefault();
                                }
                              }
                            }}
                            style={{ '--PhoneInputCountrySelect-marginRight': '0.5em' } as React.CSSProperties}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('signup.freelancer.form.password')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('signup.freelancer.form.confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.freelancer.form.university')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.freelancer.form.major')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tools"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.freelancer.form.tools')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.freelancer.form.bio')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Captcha onVerify={setCaptchaToken} />

                <Button type="submit" disabled={loading || !captchaToken} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                  {loading ? t('signup.freelancer.form.joining') : <>{t('signup.freelancer.form.joinNow')} <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t('signup.freelancer.form.welcomeCommunity')}
                </p>
                <div className="text-center text-sm text-muted-foreground mt-4">
                  {t('signup.common.haveAccount')}{" "}
                  <Link to="/login" className="font-medium text-primary hover:underline">{t('signup.common.logIn')}</Link>
                </div>
              </form>
            </Form>

          </div>
        </div>
      </div>
    </Layout>
  );
}
