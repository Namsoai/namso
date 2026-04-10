import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, BadgeCheck, Brain, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import heroMap from "@/assets/hero-map.png";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function HomePage() {
  const { t } = useTranslation();

  const whySpecialists = [
    { icon: Brain, title: t('home.why.feature1Title'), desc: t('home.why.feature1Desc') },
    { icon: Sparkles, title: t('home.why.feature2Title'), desc: t('home.why.feature2Desc') },
    { icon: Workflow, title: t('home.why.feature3Title'), desc: t('home.why.feature3Desc') },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-24 md:py-32">
        <img src={heroMap} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-10" />
        <div className="container relative z-10">
          <motion.div className="mx-auto max-w-3xl text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-[4.5rem]">
              {t('home.heroTitle1')} <br className="hidden md:block" />
              <span className="text-gradient">{t('home.heroTitle2')}</span>
            </h1>
            <p className="mb-4 text-xl font-medium text-foreground/80 md:text-2xl">
              {t('home.heroSub1')}
            </p>
            <p className="mb-10 text-base leading-relaxed text-muted-foreground md:text-lg max-w-2xl mx-auto">
              {t('home.heroSub2')}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/services">
                <Button size="lg">
                  {t('home.browseServices')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/book-call">
                <Button size="lg">
                  {t('home.bookStrategy')}
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <Shield className="mr-1 inline h-3 w-3" />
              {t('home.trustSecure')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-secondary/30 py-8">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            { icon: BadgeCheck, label: t('home.trustBar.verified') },
            { icon: Shield, label: t('home.trustBar.secure') },
            { icon: Clock, label: t('home.trustBar.fast') },
            { icon: Brain, label: t('home.trustBar.experts') },
          ].map((item, i) => (
            <motion.div key={item.label} className="flex items-center gap-2 text-sm font-medium text-muted-foreground" custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why AI Specialists */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">{t('home.why.title')}</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">{t('home.why.sub')}</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {whySpecialists.map((item, i) => (
              <motion.div key={item.title} className="text-center" custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — Purple Background */}
      <section className="hero-gradient py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="container relative z-10 text-center">
          <h2 className="mb-3 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            {t('home.cta.title')}
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-primary-foreground/80">
            {t('home.cta.sub')}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup/business">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                {t('home.cta.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/book-call">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                {t('home.bookStrategy')}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-primary-foreground/60">
            {t('home.cta.footerText')}
          </p>
        </div>
      </section>
    </Layout>
  );
}
