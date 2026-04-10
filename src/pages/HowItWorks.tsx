import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Users, Zap, Shield, ArrowRight, CheckCircle2, Lock, ThumbsUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useTranslation } from "react-i18next";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { icon: Search, title: t('howItWorks.steps.1.title'), desc: t('howItWorks.steps.1.desc') },
    { icon: Users, title: t('howItWorks.steps.2.title'), desc: t('howItWorks.steps.2.desc') },
    { icon: Zap, title: t('howItWorks.steps.3.title'), desc: t('howItWorks.steps.3.desc') },
    { icon: Shield, title: t('howItWorks.steps.4.title'), desc: t('howItWorks.steps.4.desc') },
  ];

  const benefits = [
    t('howItWorks.benefits.item1'),
    t('howItWorks.benefits.item2'),
    t('howItWorks.benefits.item3'),
    t('howItWorks.benefits.item4'),
    t('howItWorks.benefits.item5'),
    t('howItWorks.benefits.item6'),
  ];

  const paymentTrust = [
    { icon: Lock, title: t('howItWorks.securePayments.cards.escrowTitle'), desc: t('howItWorks.securePayments.cards.escrowDesc') },
    { icon: ThumbsUp, title: t('howItWorks.securePayments.cards.approvalTitle'), desc: t('howItWorks.securePayments.cards.approvalDesc') },
    { icon: ShieldCheck, title: t('howItWorks.securePayments.cards.disputeTitle'), desc: t('howItWorks.securePayments.cards.disputeDesc') },
  ];

  return (
    <Layout>
      <section className="hero-gradient py-16 md:py-20">
        <div className="container text-center">
          <motion.h1 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {t('howItWorks.heroTitle')}
          </motion.h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80">
            {t('howItWorks.heroSub')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl space-y-8">
            {steps.map((step, i) => (
              <motion.div key={step.title} className="flex gap-6" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display text-lg font-bold text-primary">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-1 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Secure Payments */}
      <section className="border-y border-border bg-card py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">{t('howItWorks.securePayments.title')}</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              {t('howItWorks.securePayments.sub')}
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {paymentTrust.map((item, i) => (
              <motion.div key={item.title} className="rounded-xl border border-border bg-background p-6 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-warm py-16">
        <div className="container">
          <h2 className="mb-8 text-center font-display text-3xl font-bold text-foreground">{t('howItWorks.benefits.title')}</h2>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="container">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground">{t('howItWorks.cta.title')}</h2>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">{t('howItWorks.cta.sub')}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/services"><Button size="lg">{t('howItWorks.cta.browse')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/signup/business"><Button size="lg" variant="outline">{t('howItWorks.cta.joinBusiness')}</Button></Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <Shield className="mr-1 inline h-3 w-3" />
            {t('howItWorks.cta.secureText')}
          </p>
        </div>
      </section>
    </Layout>
  );
}
