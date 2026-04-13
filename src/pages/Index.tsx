import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Lock,
  BadgeCheck,
  Eye,
  RotateCcw,
  HelpCircle,
  Compass,
  AlertTriangle,
  Lightbulb,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
  Heart,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useTranslation } from "react-i18next";

/* ─── animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ═══════════════════════════════════════════════════════════════════
   HOMEPAGE — "From confusion to working systems"
   ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { t } = useTranslation();

  return (
    <Layout>

      {/* ──────── 1 · HERO ──────── */}
      <section className="relative overflow-hidden bg-background hero-mesh">
        <div className="container relative z-10 py-32 md:py-44">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {t("home.heroTitle1")}
              <br />
              <span className="text-gradient">{t("home.heroTitle2")}</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("home.heroSub")}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/services">
                <Button size="lg" className="px-8">
                  {t("home.ctaPrimary")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/book-call">
                <Button size="lg" variant="outline" className="px-8">
                  {t("home.ctaSecondary")}
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              <Shield className="mr-1 inline h-3 w-3" />
              {t("home.heroTrust")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ──────── 2 · THE PROBLEM ──────── */}
      <section className="py-24 md:py-32 bg-background border-t border-border">
        <div className="container">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span className="section-tag mb-4 inline-block" variants={fadeUp} custom={0}>
              {t("home.problem.tag")}
            </motion.span>
            <motion.h2 className="font-display text-3xl font-bold text-foreground md:text-4xl" variants={fadeUp} custom={1}>
              {t("home.problem.title")}
            </motion.h2>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: HelpCircle, titleKey: "home.problem.p1Title", descKey: "home.problem.p1Desc" },
              { icon: Compass, titleKey: "home.problem.p2Title", descKey: "home.problem.p2Desc" },
              { icon: AlertTriangle, titleKey: "home.problem.p3Title", descKey: "home.problem.p3Desc" },
            ].map((item, i) => (
              <motion.div key={item.titleKey} className="rounded-2xl border border-border bg-card p-7 text-center" variants={fadeUp} custom={i}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <item.icon className="h-6 w-6 text-destructive/70" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-foreground">{t(item.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── 3 · THE SOLUTION ──────── */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span className="section-tag mb-4 inline-block" variants={fadeUp} custom={0}>
              {t("home.solution.tag")}
            </motion.span>
            <motion.h2 className="mb-5 font-display text-3xl font-bold text-foreground md:text-4xl" variants={fadeUp} custom={1}>
              {t("home.solution.title")}
            </motion.h2>
            <motion.p className="text-lg leading-relaxed text-muted-foreground" variants={fadeUp} custom={2}>
              {t("home.solution.desc")}
            </motion.p>
          </motion.div>

          {/* Transformation arrows */}
          <motion.div
            className="mx-auto grid max-w-2xl gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { labelKey: "home.solution.s1Label", resultKey: "home.solution.s1Result" },
              { labelKey: "home.solution.s2Label", resultKey: "home.solution.s2Result" },
              { labelKey: "home.solution.s3Label", resultKey: "home.solution.s3Result" },
            ].map((item, i) => (
              <motion.div
                key={item.labelKey}
                className="flex items-center justify-center gap-4 rounded-xl border border-border bg-card p-5"
                variants={fadeUp}
                custom={i}
              >
                <span className="text-base text-muted-foreground line-through decoration-destructive/40">{t(item.labelKey)}</span>
                <ArrowRightLeft className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-base font-semibold text-foreground">{t(item.resultKey)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── 4 · HOW IT WORKS ──────── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <span className="section-tag mb-4 inline-block">{t("home.process.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.process.title")}
            </h2>
          </div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-0 md:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { num: "1", icon: Lightbulb, titleKey: "home.process.step1Title", descKey: "home.process.step1Desc" },
              { num: "2", icon: ArrowRightLeft, titleKey: "home.process.step2Title", descKey: "home.process.step2Desc" },
              { num: "3", icon: CheckCircle2, titleKey: "home.process.step3Title", descKey: "home.process.step3Desc" },
              { num: "4", icon: TrendingUp, titleKey: "home.process.step4Title", descKey: "home.process.step4Desc" },
            ].map((step, i) => (
              <motion.div key={step.num} className="relative p-6 text-center" variants={fadeUp} custom={i}>
                {/* Connector line on desktop */}
                {i < 3 && (
                  <div className="absolute top-12 right-0 hidden h-px w-6 bg-border md:block" style={{ transform: "translateX(50%)" }} />
                )}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-primary">{t("home.process.tag").split(" ")[0]} {step.num}</span>
                <h3 className="mb-2 font-display text-base font-semibold text-foreground">{t(step.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(step.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── 5 · WHY NAMSO (PRINCIPLES) ──────── */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <span className="section-tag mb-4 inline-block">{t("home.principles.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.principles.title")}
            </h2>
          </div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: Shield, titleKey: "home.principles.p1Title", descKey: "home.principles.p1Desc" },
              { icon: CheckCircle2, titleKey: "home.principles.p2Title", descKey: "home.principles.p2Desc" },
              { icon: Eye, titleKey: "home.principles.p3Title", descKey: "home.principles.p3Desc" },
              { icon: Heart, titleKey: "home.principles.p4Title", descKey: "home.principles.p4Desc" },
            ].map((p, i) => (
              <motion.div key={p.titleKey} className="glass-card rounded-2xl p-7" variants={fadeUp} custom={i}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-foreground">{t(p.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(p.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── 6 · MARKET OPPORTUNITY ──────── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span className="section-tag mb-4 inline-block" variants={fadeUp} custom={0}>
              {t("home.market.tag")}
            </motion.span>
            <motion.h2 className="mb-5 font-display text-3xl font-bold text-foreground md:text-4xl" variants={fadeUp} custom={1}>
              {t("home.market.title")}
            </motion.h2>
            <motion.p className="text-lg leading-relaxed text-muted-foreground" variants={fadeUp} custom={2}>
              {t("home.market.desc")}
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: TrendingUp, labelKey: "home.market.stat1", noteKey: "home.market.stat1Note" },
              { icon: Sparkles, labelKey: "home.market.stat2", noteKey: "home.market.stat2Note" },
              { icon: Users, labelKey: "home.market.stat3", noteKey: "home.market.stat3Note" },
            ].map((s, i) => (
              <motion.div key={s.labelKey} className="rounded-2xl border border-border bg-card p-6 text-center" variants={fadeUp} custom={i}>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-1 text-sm font-semibold text-foreground">{t(s.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(s.noteKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── 7 · TRUST SIGNALS ──────── */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <span className="section-tag mb-4 inline-block">{t("home.trust.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.trust.title")}
            </h2>
          </div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: Lock, titleKey: "home.trust.t1Title", descKey: "home.trust.t1Desc" },
              { icon: BadgeCheck, titleKey: "home.trust.t2Title", descKey: "home.trust.t2Desc" },
              { icon: Eye, titleKey: "home.trust.t3Title", descKey: "home.trust.t3Desc" },
              { icon: RotateCcw, titleKey: "home.trust.t4Title", descKey: "home.trust.t4Desc" },
            ].map((item, i) => (
              <motion.div key={item.titleKey} className="text-center" variants={fadeUp} custom={i}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 font-display text-sm font-semibold text-foreground">{t(item.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────── 8 · FINAL CTA ──────── */}
      <section className="hero-gradient py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="container relative z-10 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
            {t("home.finalCta.title")}
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-primary-foreground/80">
            {t("home.finalCta.desc")}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/services">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg px-8">
                {t("home.finalCta.ctaPrimary")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/book-call">
              <Button size="lg" className="bg-white/15 text-primary-foreground border border-white/25 hover:bg-white/25 shadow-lg px-8">
                {t("home.finalCta.ctaSecondary")}
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-primary-foreground/60">
            {t("home.finalCta.footer")}
          </p>
        </div>
      </section>

    </Layout>
  );
}
