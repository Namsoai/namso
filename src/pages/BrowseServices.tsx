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
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high">("default");

  const filtered = useMemo(() => {
    const result = servicesConfig.filter((s) => {
      const title = t(s.translationKey).toLowerCase();
      const desc = t(s.descriptionKey).toLowerCase();
      const q = search.toLowerCase();
      return !search || title.includes(q) || desc.includes(q);
    });
    if (sortBy === "price-low") result.sort((a, b) => a.startingPrice - b.startingPrice);
    else if (sortBy === "price-high") result.sort((a, b) => b.startingPrice - a.startingPrice);
    return result;
  }, [search, sortBy, t]);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{t('browseServices.title')}</h1>
          <p className="text-muted-foreground">{t('browseServices.sub')}</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('browseServices.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {(["default", "price-low", "price-high"] as const).map((s) => (
              <Button 
                key={s} 
                variant={sortBy === s ? "default" : "outline"} 
                onClick={() => setSortBy(s)}
                className={cn(
                  "rounded-full px-5 transition-all",
                  sortBy === s ? "shadow-md translate-y-[-1px]" : "hover:bg-secondary"
                )}
              >
                {s === "default" ? t('browseServices.all') : s === "price-low" ? t('browseServices.priceLow') : t('browseServices.priceHigh')}
              </Button>
            ))}
          </div>
        </div>

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

        {/* Custom solution CTA */}
        <div className="mt-16 rounded-2xl border border-border bg-secondary/30 p-8 md:p-12 text-center">
          <h3 className="mb-2 font-display text-xl font-bold text-foreground">{t('browseServices.customCta')}</h3>
          <p className="mb-6 text-muted-foreground">{t('browseServices.customCtaDesc')}</p>
          <Link to="/book-call">
            <Button size="lg" className="px-8">
              {t('browseServices.bookCall')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
