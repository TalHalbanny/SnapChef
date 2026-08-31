import { createContext, useContext, useEffect, type ReactNode } from "react";
import { translate, type Language, type TranslationKey } from "./translations";

type LanguageContextValue = {
  language: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const language: Language = "he";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(language, key, params);

  useEffect(() => {
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
    localStorage.removeItem("snapchef_language");
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
