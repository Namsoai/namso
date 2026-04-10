import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Clock,
  BadgeCheck,
  Brain,
  Workflow,
  MessageSquare,
  Mail,
  PenTool,
  Lock,
  Globe,
  Eye,
  RotateCcw,
  Target,
  Calendar,
  TrendingUp,
  Zap,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useTranslation } from "react-i18next";

/* ───────────────────────── animation helpers ───────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
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

/* ═══════════════════════════════════════════════════════════════════════
   HOMEPAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"business" | "freelancer">("business");

  /* ── service card data ── */
  const services = [
    { icon: Workflow, titleKey: "home.coreServices.s1Title", descKey: "home.coreServices.s1Desc", outcomeKey: "home.coreServices.s1Outcome" },
    { icon: MessageSquare, titleKey: "home.coreServices.s2Title", descKey: "home.coreServices.s2Desc", outcomeKey: "home.coreServices.s2Outcome" },
    { icon: Mail, titleKey: "home.coreServices.s3Title", descKey: "home.coreServices.s3Desc", outcomeKey: "home.coreServices.s3Outcome" },
    { icon: PenTool, titleKey: "home.coreServices.s4Title", descKey: "home.coreServices.s4Desc", outcomeKey: "home.coreServices.s4Outcome" },
  ];

  /* ── feature highlights ── */
  const features = [
    { icon: Lock, titleKey: "home.features.f1Title", descKey: "home.features.f1Desc" },
    { icon: BadgeCheck, titleKey: "home.features.f2Title", descKey: "home.features.f2Desc" },
    { icon: Clock, titleKey: "home.features.f3Title", descKey: "home.features.f3Desc" },
    { icon: Globe, titleKey: "home.features.f4Title", descKey: "home.features.f4Desc" },
    { icon: Eye, titleKey: "home.features.f5Title", descKey: "home.features.f5Desc" },
    { icon: RotateCcw, titleKey: "home.features.f6Title", descKey: "home.features.f6Desc" },
  ];

  /* ── use cases ── */
  const useCases = [
    { icon: TrendingUp, titleKey: "home.useCases.u1Title", descKey: "home.useCases.u1Desc" },
    { icon: Zap, titleKey: "home.useCases.u2Title", descKey: "home.useCases.u2Desc" },
    { icon: BarChart3, titleKey: "home.useCases.u3Title", descKey: "home.useCases.u3Desc" },
    { icon: Users, titleKey: "home.useCases.u4Title", descKey: "home.useCases.u4Desc" },
  ];

  /* ── how-it-works steps ── */
  const businessSteps = ["home.howSplit.b1", "home.howSplit.b2", "home.howSplit.b3", "home.howSplit.b4"];
  const freelancerSteps = ["home.howSplit.f1", "home.howSplit.f2", "home.howSplit.f3", "home.howSplit.f4"];

  return (
    <Layout>
      {/* ─────────────────────── 1 · HERO ─────────────────────── */}
      <section className="relative overflow-hidden bg-background hero-mesh">
        <div className="container relative z-10 py-28 md:py-40">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="section-tag mb-6 inline-block">{t("home.heroTag")}</span>

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
                  {t("home.ctaFindSolutions")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signup/freelancer">
                <Button size="lg" variant="outline" className="px-8">
                  {t("home.ctaBecome")}
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              <Shield className="mr-1 inline h-3 w-3" />
              {t("home.heroSecure")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── 2 · TRUST BAR ─────────────────────── */}
      <section className="border-y border-border bg-secondary/30 py-6">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            { icon: BadgeCheck, key: "home.trustBar.verified" },
            { icon: Shield, key: "home.trustBar.secure" },
            { icon: Clock, key: "home.trustBar.fast" },
            { icon: Brain, key: "home.trustBar.experts" },
          ].map((item, i) => (
            <motion.div
              key={item.key}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <item.icon className="h-4 w-4 text-primary" />
              {t(item.key)}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── 3 · WHAT WE DO ─────────────────────── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span className="section-tag mb-4 inline-block" variants={fadeUp} custom={0}>
              {t("home.whatWeDo.tag")}
            </motion.span>
            <motion.h2 className="mb-5 font-display text-3xl font-bold text-foreground md:text-4xl" variants={fadeUp} custom={1}>
              {t("home.whatWeDo.title")}
            </motion.h2>
            <motion.p className="text-lg leading-relaxed text-muted-foreground" variants={fadeUp} custom={2}>
              {t("home.whatWeDo.desc")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── 4 · CORE SERVICES ─────────────────────── */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container">
          <div className="mb-12 text-center">
            <span className="section-tag mb-4 inline-block">{t("home.coreServices.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.coreServices.title")}
            </h2>
          </div>

          <motion.div
            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {services.map((s, i) => (
              <motion.div
                key={s.titleKey}
                className="glass-card rounded-2xl p-7"
                variants={fadeUp}
                custom={i}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{t(s.titleKey)}</h3>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t(s.descKey)}</p>
                <p className="text-sm font-medium text-primary">{t(s.outcomeKey)}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <Link to="/services">
              <Button variant="outline" size="lg">
                {t("home.coreServices.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────── 5 · HOW IT WORKS — SPLIT JOURNEY ─────────────────────── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="mb-10 text-center">
            <span className="section-tag mb-4 inline-block">{t("home.howSplit.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.howSplit.title")}
            </h2>
          </div>

          {/* Tab selector */}
          <div className="mx-auto mb-10 flex max-w-xs justify-center rounded-full border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setActiveTab("business")}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "business"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("home.howSplit.tabBusiness")}
            </button>
            <button
              onClick={() => setActiveTab("freelancer")}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "freelancer"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("home.howSplit.tabFreelancer")}
            </button>
          </div>

          {/* Steps */}
          <motion.div
            key={activeTab}
            className="mx-auto max-w-lg space-y-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {(activeTab === "business" ? businessSteps : freelancerSteps).map((key, i) => (
              <div key={key} className="flex items-start gap-4">
                <span className="step-number">{i + 1}</span>
                <p className="pt-1 text-base text-foreground">{t(key)}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── 6 · FEATURE HIGHLIGHTS ─────────────────────── */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container">
          <div className="mb-12 text-center">
            <span className="section-tag mb-4 inline-block">{t("home.features.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.features.title")}
            </h2>
          </div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((f, i) => (
              <motion.div key={f.titleKey} className="text-center" variants={fadeUp} custom={i}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 font-display text-sm font-semibold text-foreground">{t(f.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── 7 · CONSULTING ENTRY POINT ─────────────────────── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="section-tag mb-4 inline-block">{t("home.consulting.tag")}</span>
              <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
                {t("home.consulting.title")}
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground">
                {t("home.consulting.desc")}
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
              <div className="glass-card rounded-2xl p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-display text-base font-semibold text-foreground">{t("home.consulting.strategyTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("home.consulting.strategyDesc")}</p>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-display text-base font-semibold text-foreground">{t("home.consulting.taskTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("home.consulting.taskDesc")}</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link to="/book-call">
                <Button size="lg" className="px-10">
                  {t("home.consulting.cta")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────── 8 · USE CASES / OUTCOMES ─────────────────────── */}
      <section className="py-24 md:py-32 bg-secondary/20">
        <div className="container">
          <div className="mb-12 text-center">
            <span className="section-tag mb-4 inline-block">{t("home.useCases.tag")}</span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("home.useCases.title")}
            </h2>
          </div>

          <motion.div
            className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {useCases.map((uc, i) => (
              <motion.div key={uc.titleKey} className="glass-card rounded-2xl p-6" variants={fadeUp} custom={i}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <uc.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-display text-base font-semibold text-foreground">{t(uc.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(uc.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── 9 · FINAL CTA ─────────────────────── */}
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
                {t("home.finalCta.ctaSolutions")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/book-call">
              <Button size="lg" className="bg-white/15 text-primary-foreground border border-white/25 hover:bg-white/25 shadow-lg px-8">
                {t("home.finalCta.ctaCall")}
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
