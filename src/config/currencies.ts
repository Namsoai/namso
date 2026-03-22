export type CurrencyCode = "EUR" | "USD" | "GBP";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rateFromEUR: number;
  locale: string;
}

export const currenciesConfig: Record<CurrencyCode, CurrencyConfig> = {
  EUR: {
    code: "EUR",
    symbol: "€",
    rateFromEUR: 1,
    locale: "nl-NL", // or en-IE depending on typical formatting preference
  },
  USD: {
    code: "USD",
    symbol: "$",
    rateFromEUR: 1.08, // example rate, can be updated later via API
    locale: "en-US",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    rateFromEUR: 0.85, // example rate
    locale: "en-GB",
  },
};

/**
 * Converts a base EUR amount to the target currency amount
 */
export function convertAmount(eurAmount: number, targetCurrency: CurrencyCode): number {
  const rate = currenciesConfig[targetCurrency].rateFromEUR;
  return eurAmount * rate;
}

/**
 * Formats an amount using the specific currency locale and symbol
 */
export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  const config = currenciesConfig[currency];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
