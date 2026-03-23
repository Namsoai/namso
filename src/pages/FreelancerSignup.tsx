import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Briefcase, Brain, Globe, Zap, Euro, Users, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput from "react-phone-number-input";
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

const perks = [
  { icon: Zap, text: "Monetize your AI expertise on real projects" },
  { icon: Briefcase, text: "Build a professional portfolio with real clients" },
  { icon: Globe, text: "Work remotely with businesses worldwide" },
  { icon: Brain, text: "Stay sharp — apply your skills to diverse challenges" },
  { icon: Euro, text: "Set your own rates and availability" },
  { icon: Users, text: "Join a growing network of AI professionals" },
];

export default function FreelancerSignup() {
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
          toast({ title: "Account exists but couldn't log you in.", description: "Incorrect password. Please go to the login page to try again or reset your password.", variant: "destructive" });
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
              Join Namso as an AI Specialist
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">
              Apply to join our marketplace and start working with businesses worldwide. Use your AI expertise to deliver real solutions, build your reputation, and grow your freelance career.
            </p>
            <p className="mb-8 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Ideal for professionals experienced with tools like ChatGPT, Zapier, Make, n8n, Notion AI, Airtable, Google Workspace, and other AI platforms.
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
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">Apply to Join</h2>
            <p className="mb-6 text-sm text-muted-foreground">Join instantly and start exploring projects.</p>


            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" {...field} />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
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
                            defaultCountry="US"
                            placeholder="Enter phone number"
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full bg-transparent border-none focus:outline-none"
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min. 6 characters" {...field} />
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
                          <Input type="password" placeholder="Repeat password" {...field} />
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
                      <FormLabel>Organization / University</FormLabel>
                      <FormControl>
                        <Input placeholder="Your organization or university" {...field} />
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
                      <FormLabel>Area of Expertise</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., AI Automation, Chatbots, Data..." {...field} />
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
                      <FormLabel>AI Tools &amp; Skills</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ChatGPT, Zapier, Make, n8n..." {...field} />
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
                      <FormLabel>Tell us about your experience</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What AI projects have you worked on? What kind of solutions do you specialize in?" 
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
                  {loading ? "Joining..." : "Join Now"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Welcome to our freelancer community!
                </p>
                <div className="text-center text-sm text-muted-foreground mt-4">
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
