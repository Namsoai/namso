import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Building2, FileText, Shield, Users, Zap, AlertCircle, Mail, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Layout from "@/components/Layout";
import Captcha from "@/components/Captcha";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

// Very basic disposable email check
const DISPOSABLE_DOMAINS = ["tempmail.com", "guerrillamail.com", "yopmail.com", "mailinator.com", "10minutemail.com"];

const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required."),
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Please enter a valid email address.")
    .refine((val) => {
      const domain = val.split('@')[1];
      return domain && !DISPOSABLE_DOMAINS.includes(domain.toLowerCase());
    }, "Please use a proper business email, not a disposable one."),
  phone: z.string().min(8, "A valid mobile phone number is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const benefits = [
  { icon: Zap, text: "Post tasks quickly and get proposals fast" },
  { icon: Users, text: "Get matched with verified freelancers" },
  { icon: Shield, text: "Manage payments securely" },
  { icon: FileText, text: "Review work before approval" },
  { icon: Building2, text: "Find affordable AI help for your business" },
];

export default function BusinessSignup() {
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>("US");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
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

  // Track funnel: user landed on the signup page
  useEffect(() => {
    trackEvent("business_signup_started");
  }, []);
  const onSubmit = async (data: FormValues) => {
    if (!captchaToken) {
      toast({ title: "Please complete the CAPTCHA check.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const normalizedEmail = data.email.trim().toLowerCase();
    const { data: authData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: data.password,
      options: {
        data: {
          user_type: "business",
          full_name: data.fullName,
          business_name: data.businessName,
          phone: data.phone,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
        // Automatically attempt login instead
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: data.password,
        });
        
        if (signInError) {
          toast({ title: "Account exists but couldn't log you in.", description: "Incorrect password. Please go to the login page to try again or reset your password.", variant: "destructive" });
          setLoading(false);
          return;
        }
        
        navigate("/business");
        return;
      }
      
      toast({ title: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }



    setLoading(false);
    trackEvent("business_signup_completed", { business_name: data.businessName });
    navigate(`/business`);
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Join as a Business
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">
              Create a business account to post AI tasks, review freelancer proposals, and manage work in one place.
            </p>
            <div className="space-y-3.5">
              {benefits.map((b) => (
                <div key={b.text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">Create Your Account</h2>
            <p className="mb-6 text-sm text-muted-foreground">Start posting tasks in minutes.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
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
                      <FormLabel>Mobile Phone</FormLabel>
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
                              // Prevent backspace/delete if it would remove the country code prefix
                              if ((e.key === 'Backspace' || e.key === 'Delete')) {
                                // Find the first space or the first few digits which usually represent the dial code
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Captcha onVerify={setCaptchaToken} />

                <Button type="submit" disabled={loading || !captchaToken} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                  {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <p className="text-center text-xs text-muted-foreground">
                  <Shield className="mr-1 inline h-3 w-3" />
                  Secure checkout · Protected payments · Pay only after approval
                </p>
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-primary hover:underline">Log In</Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
