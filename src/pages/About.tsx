import { motion } from "framer-motion";
import { Target, Heart, Lightbulb, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();

  const values = [
    { icon: Target, title: t('about.values.resultsTitle'), desc: t('about.values.resultsDesc') },
    { icon: Heart, title: t('about.values.fairTitle'), desc: t('about.values.fairDesc') },
    { icon: Lightbulb, title: t('about.values.forwardTitle'), desc: t('about.values.forwardDesc') },
    { icon: Users, title: t('about.values.communityTitle'), desc: t('about.values.communityDesc') },
  ];

  return (
    <Layout>
      <section className="hero-gradient py-16 md:py-20">
        <div className="container text-center">
          <motion.h1 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {t('about.heroTitle')}
          </motion.h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80">
            {t('about.heroSub')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-primary">{t('about.missionTitle')}</h2>
          <p className="mb-8 text-lg leading-relaxed text-foreground">
            {t('about.missionText')}
          </p>

          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">{t('about.storyTitle')}</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            {t('about.storyText1')}
          </p>
          <p className="leading-relaxed text-muted-foreground">
            {t('about.storyText2')}
          </p>
        </div>
      </section>

      {/* Who Namso Is For */}
      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">{t('about.whoTitle')}</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('about.whoText')}
          </p>
        </div>
      </section>

      <section className="surface-warm py-16">
        <div className="container">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-foreground">{t('about.valuesTitle')}</h2>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                className="flex gap-4 rounded-xl border border-border bg-card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-display font-semibold text-foreground">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="container">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">{t('about.learnMoreTitle')}</h2>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">{t('about.learnMoreSub')}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/how-it-works"><Button>{t('about.howItWorks')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/contact"><Button variant="outline">{t('about.contactUs')}</Button></Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
