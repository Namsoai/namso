import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, ShieldCheck, Star, BadgeCheck, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { servicesConfig } from "@/config/services";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function ServiceDetail() {
  const { id } = useParams();
  const { user, roles } = useAuth();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const service = servicesConfig.find((s) => s.id === id);

  const isBusiness = roles.includes("business");
  const isLoggedIn = !!user;

  const [deliveryType, setDeliveryType] = useState<"standard" | "express" | "custom">("standard");
  const [customDays, setCustomDays] = useState<string>("7");

  if (!service) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-lg text-muted-foreground">Service not found.</p>
          <Link to="/services"><Button className="mt-4">Browse Services</Button></Link>
        </div>
      </Layout>
    );
  }

  const getDeliveryDays = () => {
    if (deliveryType === "standard") return 5;
    if (deliveryType === "express") return 2;
    return parseInt(customDays) || 5;
  };

  const currentDeliveryDays = getDeliveryDays();
  const deliveryPayload = {
    type: deliveryType,
    value: currentDeliveryDays,
    unit: "days",
    urgencyMultiplier: deliveryType === "express" ? 1.2 : 1.0, // Future hook for urgency pricing
  };

  const handleHireClick = () => {
    // Save to session storage as well for simple persistence
    sessionStorage.setItem("checkout_delivery", JSON.stringify(deliveryPayload));
    sessionStorage.setItem("checkout_service", JSON.stringify(service));
    navigate("/business/post-task", { state: { serviceId: id, deliveryTime: deliveryPayload } });
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Link to="/services" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 flex h-48 items-center justify-center rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 md:h-64">
              <span className="font-display text-xl font-semibold uppercase text-primary/50">{service.tier} {t("pricing.tier")}</span>
            </div>

            <h1 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">{t(service.translationKey)}</h1>

            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-amber">
                <Star className="h-4 w-4 fill-current" /> New Service
              </span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {currentDeliveryDays}-day delivery</span>
              <span className="flex items-center gap-1 text-primary">
                <BadgeCheck className="h-4 w-4" /> Verified freelancer
              </span>
            </div>

            <Separator className="my-6" />

            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">About This Service</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
               This is a premium {service.tier}-tier service designed for AI automation and integration. All services proceed via secure escrow milestones.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Final scope and pricing are agreed between you and the freelancer before work begins. Additional complexity may affect the final price.
            </p>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-1 text-center">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Starting at</span>
                </div>
                <div className="mb-4 text-center">
                  {service.previousPrice > 0 && (
                    <span className="mr-2 text-sm text-muted-foreground line-through">
                      {formatPrice(service.previousPrice)}
                    </span>
                  )}
                  <span className="font-display text-3xl font-bold text-foreground">{formatPrice(service.agencyPrice)}</span>
                </div>

                <div className="mb-6 space-y-3">
                  <label className="text-sm font-medium text-foreground">{t("deliveryTime.label")}</label>
                  <Select value={deliveryType} onValueChange={(val: any) => setDeliveryType(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("deliveryTime.selectOption")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">{t("deliveryTime.options.standard")}</SelectItem>
                      <SelectItem value="express">{t("deliveryTime.options.express")}</SelectItem>
                      <SelectItem value="custom">{t("deliveryTime.options.custom")}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {deliveryType === "custom" && (
                    <div className="pt-2">
                       <label className="mb-1 block text-xs text-muted-foreground">{t("deliveryTime.customDaysLabel")}</label>
                       <Input 
                         type="number" 
                         min="1" 
                         max="60" 
                         value={customDays} 
                         onChange={(e) => setCustomDays(e.target.value)} 
                       />
                    </div>
                  )}
                </div>

                {isBusiness ? (
                  <>
                    <Button onClick={handleHireClick} className="mb-3 w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                      Hire for This Task
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Post a task to request this service and assign it directly.
                    </p>
                  </>
                ) : isLoggedIn ? (
                  <>
                    <Link to="/signup/business">
                      <Button className="mb-3 w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                        Create Business Account
                      </Button>
                    </Link>
                    <p className="text-center text-xs text-muted-foreground">
                      You need a business account to hire freelancers.
                    </p>
                  </>
                ) : (
                  <>
                    <Link to="/signup/business">
                      <Button className="mb-3 w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
                        Create Business Account
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" className="w-full" size="lg">
                        Log In
                      </Button>
                    </Link>
                  </>
                )}

                <Separator className="my-4" />
                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {currentDeliveryDays}-day delivery</div>
                  <div className="flex items-center gap-2"><Lock className="h-4 w-4 shrink-0" /> Secure escrow payment</div>
                  <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 shrink-0" /> Revisions included</div>
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0" /> Pay only after approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
