import { motion } from "framer-motion";
import { Target, Heart, Lightbulb, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const values = [
  { icon: Target, title: "Results-Driven", desc: "Every project on Namso is focused on delivering measurable business outcomes — not just recommendations." },
  { icon: Heart, title: "Fair & Transparent", desc: "Clear pricing, secure payments, and a platform built on trust between businesses and specialists." },
  { icon: Lightbulb, title: "Forward-Thinking", desc: "We believe AI will reshape how businesses operate. Our platform connects the right expertise with real business needs." },
  { icon: Users, title: "Community", desc: "We're building a network of skilled AI professionals and forward-thinking businesses driving innovation together." },
];

export default function About() {
  return (
    <Layout>
      <section className="hero-gradient py-16 md:py-20">
        <div className="container text-center">
          <motion.h1 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            About Namso
          </motion.h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80">
            Namso is the AI freelance marketplace that connects businesses with verified integration specialists.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-primary">Our Mission</h2>
          <p className="mb-8 text-lg leading-relaxed text-foreground">
            Namso exists to make AI implementation accessible for every business. We connect companies with verified AI specialists who can build automations, deploy intelligent systems, and integrate AI tools — turning complex technology into practical business solutions.
          </p>

          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Our Story</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Namso started with a clear observation: businesses of all sizes want to leverage AI but struggle to find reliable, specialized talent to implement it. Meanwhile, skilled AI professionals need a dedicated platform to connect with businesses that value their expertise.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            We built Namso to bridge that gap. Our marketplace makes it easy for businesses anywhere in the world to find verified AI specialists who can automate workflows, deploy chatbots, build intelligent systems, and much more — with transparent pricing and secure payments.
          </p>
        </div>
      </section>

      {/* Who Namso Is For */}
      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Who Namso Is For</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Namso is built for businesses that want to implement AI solutions without the overhead of traditional consulting firms or the uncertainty of general freelance platforms.
          </p>
        </div>
      </section>

      <section className="surface-warm py-16">
        <div className="container">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-foreground">Our Values</h2>
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
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Want to Learn More?</h2>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">See how Namso connects businesses with verified AI integration specialists.</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/how-it-works"><Button>How It Works <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/contact"><Button variant="outline">Contact Us</Button></Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
