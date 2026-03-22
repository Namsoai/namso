import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import nlTranslations from "./locales/nl.json";
import frTranslations from "./locales/fr.json";
import esTranslations from "./locales/es.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      nl: { translation: nlTranslations },
      fr: { translation: frTranslations },
      es: { translation: esTranslations },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "nl", "fr", "es"],
    detection: {
      order: ["localStorage", "cookie", "navigator"],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

export default i18n;
