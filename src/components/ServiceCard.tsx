import { Link } from "react-router-dom";
import { 
  Star, 
  BadgeCheck, 
  FileText, 
  Bot, 
  Database, 
  PenTool, 
  Image as ImageIcon, 
  Search, 
  Globe, 
  Mail, 
  Workflow, 
  MessageSquare 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { ServiceConfig } from "@/config/services";

const IconMap: Record<string, any> = {
  FileText,
  Bot,
  Database,
  PenTool,
  Image: ImageIcon,
  Search,
  Globe,
  Mail,
  Workflow,
  MessageSquare,
};

export default function ServiceCard({ service }: { service: ServiceConfig }) {
  const { t } = useTranslation();
  const IconComponent = IconMap[service.icon] || FileText;

  return (
    <Link to={`/services/${service.id}`} className="group block">
      <div className="card-hover overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex h-32 items-center justify-center bg-secondary/30 transition-colors group-hover:bg-primary/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-transform group-hover:scale-110">
            <IconComponent className="h-8 w-8" />
          </div>
        </div>
        <div className="p-5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="px-2 py-0.5 text-[11px] font-normal uppercase">
                {service.tier}
              </Badge>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-amber">
              <Star className="h-3 w-3 fill-current" /> New
            </span>
          </div>
          <h3 className="mb-3 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {t(service.translationKey)}
          </h3>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-primary/70">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            </div>
            <div className="text-right">
              {service.previousPrice > 0 && (
                <span className="block text-[10px] text-muted-foreground line-through">
                  €{service.previousPrice}
                </span>
              )}
              <span className="block text-[10px] text-muted-foreground">{t("pricing.agencyPrice")}</span>
              <span className="font-display text-base font-bold text-foreground">
                €{service.agencyPrice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

