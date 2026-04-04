import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Users, Zap, Shield, ArrowRight, CheckCircle2, Lock, ThumbsUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const steps = [
  { icon: Search, title: "Post Your Project", desc: "Describe the AI integration you need — from chatbot deployment to workflow automation or data pipeline setup. Posting is free." },
  { icon: Users, title: "Get Matched With Specialists", desc: "Assign your project directly to verified AI specialists who fit your needs." },
  { icon: Zap, title: "Work Gets Done", desc: "Your specialist implements the solution using industry-leading AI tools. Review deliverables and request revisions if needed." },
  { icon: Shield, title: "Pay Securely", desc: "Release payment only when you're satisfied. If a project isn't delivered as agreed, our team provides support and a fair resolution process." },
];

const benefits = [
  "Verified AI integration specialists",
  "Hands-on implementation, not just advice",
  "Fast turnaround — most projects in 1–5 days",
  "Secure escrow payments",
  "Transparent pricing on every listing",
  "Revision support on every project",
];

const paymentTrust = [
  { icon: Lock, title: "Escrow Protection", desc: "Funds are held securely until the project is delivered as agreed." },
  { icon: ThumbsUp, title: "Client Approval", desc: "Review the deliverables, request revisions if needed, and approve only when satisfied." },
  { icon: ShieldCheck, title: "Dispute Resolution", desc: "If a project isn't delivered as agreed, our team provides support and a fair resolution process." },
];

export default function HowItWorks() {
  return (
    <Layout>
      <section className="hero-gradient py-16 md:py-20">
        <div className="container text-center">
          <motion.h1 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            How Namso Works
          </motion.h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80">
            Hire verified AI specialists to implement solutions for your business — here's how.
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
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">Secure Payments</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Pay with confidence through our secure checkout. Your payment is only released after you review and approve the completed work.
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
          <h2 className="mb-8 text-center font-display text-3xl font-bold text-foreground">Why Businesses Choose Namso</h2>
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
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">Browse services from verified AI specialists or create a business account to post projects.</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/services"><Button size="lg">Browse Services <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/signup/business"><Button size="lg" variant="outline">Join as a Business</Button></Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <Shield className="mr-1 inline h-3 w-3" />
            Secure checkout · Protected payments · Pay only after approval
          </p>
        </div>
      </section>
    </Layout>
  );
}
