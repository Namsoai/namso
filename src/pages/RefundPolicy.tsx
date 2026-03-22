import Layout from "@/components/Layout";
import { Shield, RefreshCw, MessageSquare, Scale } from "lucide-react";

const steps = [
  { icon: MessageSquare, title: "Contact Us", desc: "If you're unsatisfied with delivered work, reach out to us within 7 days of delivery at info.namsoai@gmail.com with your task details." },
  { icon: RefreshCw, title: "Revision First", desc: "We encourage businesses and freelancers to resolve issues through revisions. Most tasks include revision support as part of the agreement." },
  { icon: Scale, title: "Fair Review", desc: "If revisions don't resolve the issue, our team reviews the case fairly, considering the original scope, deliverables, and communication between both parties." },
  { icon: Shield, title: "Resolution", desc: "Based on our review, we may issue a partial or full refund, or facilitate a revised delivery. Our goal is a fair outcome for both sides." },
];

export default function RefundPolicy() {
  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">Refund & Resolution Policy</h1>
          <p className="mb-6 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Overview</h2>
              <p>At Namso, we use an escrow-based payment model. Your funds are held securely and only released to the freelancer after you review and approve the completed work. This protects both businesses and freelancers.</p>
            </section>

            <section>
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">How Our Resolution Process Works</h2>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={step.title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="mb-1 font-display text-sm font-semibold text-foreground">{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Key Points</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li>Funds are only released after the business approves the delivered work.</li>
                <li>Refund requests must be submitted within 7 days of task delivery.</li>
                <li>We review each case individually — there are no automatic refunds.</li>
                <li>Both the business and freelancer have the opportunity to share their perspective.</li>
                <li>Namso's decision is final in disputes that cannot be resolved between the parties.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Contact</h2>
              <p>To start a refund request or report an issue, email us at <a href="mailto:info.namsoai@gmail.com" className="text-primary hover:underline">info.namsoai@gmail.com</a> with your task ID and a description of the issue.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
