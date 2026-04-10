import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const subject = (form.get("subject") as string).trim();
    const message = (form.get("message") as string).trim();

    if (!name || !email || !subject || !message) {
      toast({ title: "Please fill in all fields.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("contact_messages").insert({ name, email, subject, message });

    if (error) {
      toast({ title: "Failed to send message. Please try again.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Send admin notification via edge function
    try {
      await supabase.functions.invoke("send-contact-email", {
        body: { name, email, subject, message },
      });
    } catch {
      // Non-blocking — message is already saved
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <motion.div className="max-w-md text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Message Sent!</h1>
            <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you within 24 hours at the email you provided.</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">Get in Touch</h1>
            <p className="mb-8 text-lg text-muted-foreground">Have a question, partnership idea, or feedback? We'd love to hear from you.</p>
            <div className="space-y-4">
              {[
                { icon: Mail, label: "info.namsoai@gmail.com", sub: "Email support" },
                { icon: Clock, label: "We aim to respond within 24 hours", sub: "Response time" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required maxLength={255} />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required maxLength={200} />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={5} required maxLength={2000} />
              <p className="mt-1 text-xs text-muted-foreground">Max 2,000 characters.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
