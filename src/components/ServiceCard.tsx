import { Link } from "react-router-dom";
import { 
  BadgeCheck, 
  Database, 
  Search, 
  Globe, 
  Mail, 
  Workflow, 
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ServiceConfig } from "@/config/services";

const IconMap: Record<string, any> = {
  Database,
  Search,
  Globe,
  Mail,
  Workflow,
  MessageSquare,
};

export default function ServiceCard({ service }: { service: ServiceConfig }) {
  const { t } = useTranslation();
  const IconComponent = IconMap[service.icon] || Workflow;

  return (
    <Link to={`/services/${service.id}`} className="group block">
      <div className="glass-card overflow-hidden rounded-2xl h-full flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>

          <h3 className="mb-2 font-display text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {t(service.translationKey)}
          </h3>

          <p className="mb-4 text-sm leading-relaxed text-muted-foreground flex-1">
            {t(service.descriptionKey)}
          </p>

          <p className="mb-4 text-sm font-medium text-primary">
            {t(service.outcomeKey)}
          </p>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-1.5 text-xs text-primary/70">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t("serviceDetail.verifiedSpecialist")}
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              {t("serviceDetail.from")} €{service.startingPrice}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
