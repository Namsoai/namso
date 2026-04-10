import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/Layout";
import { faqs } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <motion.div className="mx-auto max-w-3xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-center font-display text-3xl font-bold text-foreground md:text-4xl">{t('faq.heroTitle')}</h1>
          <p className="mb-10 text-center text-muted-foreground">{t('faq.heroSub')}</p>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="font-display font-semibold text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <p className="mb-4 text-muted-foreground">{t('faq.stillHaveQuestions')}</p>
            <Link to="/contact"><Button>{t('faq.contactUs')}</Button></Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
