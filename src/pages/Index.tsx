import { Link } from "react-router-dom";
// Cache bust to trigger fresh Vercel build
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, BadgeCheck, Brain, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import heroMap from "@/assets/hero-map.png";

const whySpecialists = [
  { icon: Brain, title: "Deep AI Expertise", desc: "Our specialists work with AI tools daily — from GPT integrations and automation platforms to custom AI agent workflows." },
  { icon: Sparkles, title: "Implementation-Focused", desc: "Not just advice — our freelancers build, deploy, and integrate AI solutions directly into your business operations." },
  { icon: Workflow, title: "Business-Ready Solutions", desc: "Every project is scoped for real business impact — streamlined workflows, reduced manual work, and measurable results." },
];



const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function HomePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-24 md:py-32">
        <img src={heroMap} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-10" />
        <div className="container relative z-10">
          <motion.div className="mx-auto max-w-3xl text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-[4.5rem]">
              Find the perfect <br className="hidden md:block" />
              <span className="text-gradient">AI Integration Specialists</span>
            </h1>
            <p className="mb-4 text-xl font-medium text-foreground/80 md:text-2xl">
              Connect with verified freelancers who build intelligent systems.
            </p>
            <p className="mb-10 text-base leading-relaxed text-muted-foreground md:text-lg max-w-2xl mx-auto">
              Hire experienced AI specialists to integrate tools like ChatGPT, automate workflows, and aggressively streamline your business operations without the overhead.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/services">
                <Button size="lg">
                  Browse Services <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signup/business">
                <Button size="lg">
                  Get Started as a Business
                </Button>
              </Link>
              <Link to="/book-call">
                <Button size="lg">
                  Book Strategy Call
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <Shield className="mr-1 inline h-3 w-3" />
              Secure payments · Verified specialists · Pay only after approval
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-secondary/30 py-8">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            { icon: BadgeCheck, label: "Verified Specialists" },
            { icon: Shield, label: "Secure Payments" },
            { icon: Clock, label: "Fast Delivery" },
            { icon: Brain, label: "AI Integration Experts" },
          ].map((item, i) => (
            <motion.div key={item.label} className="flex items-center gap-2 text-sm font-medium text-muted-foreground" custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works — Preview */}
      <section className="py-20 md:py-32">
        <div className="container text-center">
          <h2 className="mb-3 font-display text-3xl font-bold text-foreground">How Namso Works</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Post a project, get matched with verified AI specialists, review the deliverables, and pay only after approval.
          </p>
          <Link to="/how-it-works">
            <Button variant="outline">
              View How It Works <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>



      {/* Why AI Specialists */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">Why Hire AI Integration Specialists?</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Our freelancers bring deep technical expertise, hands-on implementation skills, and a focus on real business outcomes.</p>
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



      <section className="bg-secondary/30 py-20 md:py-32 relative overflow-hidden text-center border-t border-border">
        <div className="container relative z-10">
          <h2 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Ready to Integrate AI Into Your Business?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground">
            Hire verified AI specialists to automate workflows, build intelligent systems, and drive real business results.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/services">
              <Button size="lg">
                Browse Services <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup/business">
              <Button size="lg">
                Join as a Business
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Create a free business account · Post projects · Pay only after approval
          </p>
        </div>
      </section>
    </Layout>
  );
}
