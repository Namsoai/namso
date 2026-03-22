import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencyCode } from "@/config/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageCurrencySwitcher() {
  const { i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
        <SelectTrigger className="h-8 w-[80px] bg-transparent text-xs">
          <SelectValue placeholder="Lang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">EN</SelectItem>
          <SelectItem value="nl">NL</SelectItem>
          <SelectItem value="fr">FR</SelectItem>
          <SelectItem value="es">ES</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currency} onValueChange={(val) => setCurrency(val as CurrencyCode)}>
        <SelectTrigger className="h-8 w-[80px] bg-transparent text-xs">
          <SelectValue placeholder="Cur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EUR">EUR (€)</SelectItem>
          <SelectItem value="USD">USD ($)</SelectItem>
          <SelectItem value="GBP">GBP (£)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
