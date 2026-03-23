import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import ServiceCard from "@/components/ServiceCard";
import { servicesConfig, ServiceTier } from "@/config/services";
import { useTranslation } from "react-i18next";

export default function BrowseServices() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<ServiceTier | "">("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high">("default");

  const filtered = useMemo(() => {
    const result = servicesConfig.filter((s) => {
      const title = t(s.translationKey).toLowerCase();
      const matchesSearch = !search || title.includes(search.toLowerCase());
      const matchesTier = !selectedTier || s.tier === selectedTier;
      return matchesSearch && matchesTier;
    });
    if (sortBy === "price-low") result.sort((a, b) => a.agencyPrice - b.agencyPrice);
    else if (sortBy === "price-high") result.sort((a, b) => b.agencyPrice - a.agencyPrice);
    return result;
  }, [search, selectedTier, sortBy, t]);

  const tiers: ServiceTier[] = ["low", "medium", "high"];

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Browse Services</h1>
          <p className="text-muted-foreground">Professional AI integration services delivered by verified specialists. Secure payments, transparent pricing.</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                {s === "default" ? "All" : s === "price-low" ? "Price ↑" : "Price ↓"}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Badge
            variant={!selectedTier ? "default" : "secondary"}
            className="cursor-pointer rounded-full px-4 py-1.5 transition-all hover:scale-105"
            onClick={() => setSelectedTier("")}
          >
            All
          </Badge>
          {tiers.map((tier) => (
            <Badge
              key={tier}
              variant={selectedTier === tier ? "default" : "secondary"}
              className="cursor-pointer rounded-full px-4 py-1.5 capitalize transition-all hover:scale-105"
              onClick={() => setSelectedTier(tier === selectedTier ? "" : tier)}
            >
              {tier} Tier
            </Badge>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <SlidersHorizontal className="mx-auto mb-4 h-12 w-12" />
            <p className="text-lg font-medium">No services found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                <Shield className="mr-1 inline h-3 w-3" />
                All services include secure escrow payments. You only pay after you approve the work.
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
