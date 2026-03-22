import React, { createContext, useContext, useEffect, useState } from "react";
import { CurrencyCode, convertAmount, formatCurrencyAmount } from "@/config/currencies";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (eurAmount: number) => string;
  convertedValue: (eurAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency") as CurrencyCode;
    if (saved && ["EUR", "USD", "GBP"].includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("preferred_currency", c);
  };

  const formatPrice = (eurAmount: number) => {
    const converted = convertAmount(eurAmount, currency);
    return formatCurrencyAmount(converted, currency);
  };

  const convertedValue = (eurAmount: number) => {
    return convertAmount(eurAmount, currency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertedValue }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
