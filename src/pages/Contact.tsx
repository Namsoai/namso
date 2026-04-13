import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const subject = (form.get("subject") as string).trim();
    const message = (form.get("message") as string).trim();

    if (!name || !email || !subject || !message) {
      setError(t('contact.errors.fillAll'));
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("contact_messages").insert({ name, email, subject, message });

    if (dbError) {
      setError(t('contact.errors.failedSend'));
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

  return (
    <Layout>
      <div className="container py-12 md:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center md:mb-16">
            <motion.h1 className="mb-4 font-display text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {t('contact.heroTitle')}
            </motion.h1>
            <motion.p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {t('contact.heroSub')}
            </motion.p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr,1.5fr] lg:gap-16">
            <motion.div className="flex flex-col gap-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-foreground">{t('contact.emailSupport')}</h3>
                <a href="mailto:hello@namso.ai" className="group flex items-center text-lg font-medium text-primary hover:underline">
                  hello@namso.ai
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-foreground">{t('contact.responseTimeTitle')}</h3>
                <p className="text-muted-foreground">{t('contact.responseTimeDesc')}</p>
              </div>
            </motion.div>

            <motion.div className="relative" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              {/* Decorative elements */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/0 opacity-50 blur-xl"></div>
              
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8 md:p-10">
                <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-foreground">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  {t('contact.heroTitle')}
                </h2>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[400px] flex-col items-center justify-center text-center">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      </div>
                      <h3 className="mb-3 font-display text-2xl font-bold text-foreground">{t('contact.success.title')}</h3>
                      <p className="mb-8 max-w-md text-muted-foreground">{t('contact.success.desc')}</p>
                      <Button onClick={() => setSubmitted(false)} variant="outline">{t('common.back')}</Button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleSubmit} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {error && (
                        <div className="rounded-lg bg-destructive/10 p-4 text-sm font-medium text-destructive">
                          {error}
                        </div>
                      )}
                      
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('contact.form.name')}</Label>
                          <Input id="name" name="name" className="h-12 bg-background/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('contact.form.email')}</Label>
                          <Input type="email" id="email" name="email" className="h-12 bg-background/50" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                        <Input id="subject" name="subject" className="h-12 bg-background/50" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{t('contact.form.message')}</Label>
                        <Textarea id="message" name="message" rows={5} className="resize-none bg-background/50" />
                        <p className="text-right text-xs text-muted-foreground">{t('contact.form.maxLength')}</p>
                      </div>

                      <Button type="submit" className="w-full sm:w-auto" size="lg" disabled={loading}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent"></span>
                            {t('contact.form.submitting')}
                          </span>
                        ) : (
                          t('contact.form.submit')
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
