import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  // Handle i18n initialization edge cases where language might be a full string like 'en-US'
  const currentLangCode = (i18n.language || "en").substring(0, 2);

  return (
    <Select value={currentLangCode} onValueChange={(val) => i18n.changeLanguage(val)}>
      <SelectTrigger className="h-9 rounded-full bg-secondary/50 px-3 hover:bg-secondary border-transparent hover:border-border/50 focus:ring-1 focus:ring-primary/20 shadow-sm transition-all text-sm font-medium">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Language" />
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[140px] rounded-xl border-border/50 shadow-lg">
        {LANGUAGES.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code} 
            className="cursor-pointer rounded-lg py-2 focus:bg-primary/5"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
