// This context is deprecated and no longer used in the application.
// Currency features have been removed in favor of a fixed Euro display.
export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useCurrency = () => {
  throw new Error("useCurrency is deprecated and should not be used.");
};
