import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ServiceCard from "@/components/ServiceCard";
import { servicesConfig } from "@/config/services";
import { useTranslation } from "react-i18next";

export default function BrowseServices() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return servicesConfig.filter((s) => {
      const title = t(s.translationKey).toLowerCase();
      const desc = t(s.descriptionKey).toLowerCase();
      const q = search.toLowerCase();
      return !search || title.includes(q) || desc.includes(q);
    });
  }, [search, t]);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{t('browseServices.title')}</h1>
          <p className="max-w-2xl text-muted-foreground">{t('browseServices.sub')}</p>
        </div>

        {/* Intake CTA — primary path, above solutions */}
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="mb-1 font-display text-lg font-bold text-foreground">{t('browseServices.customCta')}</h3>
            <p className="text-sm text-muted-foreground">{t('browseServices.customCtaDesc')}</p>
          </div>
          <Link to="/book-call" className="shrink-0">
            <Button size="lg" className="px-8">
              {t('browseServices.startProject')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Search (light, optional) */}
        {servicesConfig.length > 4 && (
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t('browseServices.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
        )}

        {/* Solutions grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <SlidersHorizontal className="mx-auto mb-4 h-12 w-12" />
            <p className="text-lg font-medium">{t('browseServices.noServices')}</p>
            <p className="text-sm">{t('browseServices.noServicesSub')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                <Shield className="mr-1 inline h-3 w-3" />
                {t('browseServices.secureNotice')}
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
