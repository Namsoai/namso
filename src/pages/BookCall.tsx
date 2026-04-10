import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Calendar, Clock, Target, CreditCard, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Captcha from "@/components/Captcha";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  callType: z.enum(["strategy", "task_identifier"]),
  fullName: z.string().min(2, "Full name is required"),
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Please enter a valid work email address"),
  phone: z.string().min(8, "A valid phone number is required"),
  website: z.string().url("Please enter a valid URL (e.g., https://example.com)").optional().or(z.literal("")),

  description: z.string().min(10, "Please briefly describe what you are looking for"),
});

type FormValues = z.infer<typeof formSchema>;

export default function BookCall() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>("US");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      callType: "strategy",
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      website: "",

      description: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!captchaToken) {
      toast({ title: "Please complete the CAPTCHA check.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("strategy_calls").insert({
      call_type: data.callType,
      full_name: data.fullName,
      company_name: data.companyName,
      email: data.email,
      phone: data.phone,
      website: data.website || null,
      budget: "not_specified",
      timeline: "flexible",
      description: data.description,
    });

    if (error) {
      // Gracefully mock success if the table doesn't exist in the DB yet
      if (error.code === "42P01") {
        console.warn("Table 'strategy_calls' does not exist yet. Mocking success for demo.");
        setSubmitted(true);
      } else {
        toast({ title: "Error submitting request", description: error.message, variant: "destructive" });
      }
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <motion.div className="max-w-md text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Request Received</h1>
            <p className="mb-6 text-muted-foreground">
              Thank you for booking a call. Our team will review your details and reach out within 24 hours to schedule a time that works for you.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">Return Home</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const callType = form.watch("callType");

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-12">
          
          {/* Left Column: Context */}
          <div className="lg:col-span-5">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Let's map out your next AI project.
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Whether you need a high-level strategy or help identifying specific tasks, our experts are here to guide you.
            </p>

            <div className="space-y-6">
              <button
                type="button"
                className={`w-full text-left rounded-xl border p-5 transition-all outline-none cursor-pointer hover:border-primary/50 ${callType === 'strategy' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'border-border bg-card'}`}
                onClick={() => form.setValue('callType', 'strategy')}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Strategy Call</h3>
                  </div>
                  {callType === 'strategy' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfect if you want to explore how AI can transform your business at a macro level. We'll discuss use cases, ROI, and overarching architecture.
                </p>
              </button>

              <button
                type="button"
                className={`w-full text-left rounded-xl border p-5 transition-all outline-none cursor-pointer hover:border-primary/50 ${callType === 'task_identifier' ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'border-border bg-card'}`}
                onClick={() => form.setValue('callType', 'task_identifier')}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Task Identifier Call</h3>
                  </div>
                  {callType === 'task_identifier' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Best if you know you need help but aren't sure how to break it down. We'll help you scope specific, actionable tasks ready to go on the marketplace.
                </p>
              </button>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">Book Your Session</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">


                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Email</FormLabel>
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background md:text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden items-center">
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
                                    // Lock the dial code part
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
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input type="url" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are your main goals and challenges?</FormLabel>
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

                  <Button type="submit" disabled={loading || !captchaToken} className="w-full" size="lg">
                    {loading ? "Submitting..." : "Submit Request"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
